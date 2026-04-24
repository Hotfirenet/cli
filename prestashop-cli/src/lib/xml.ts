// ─── Types ────────────────────────────────────────────────────────────────────

type PsValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<{ id: string | number; value: string }>
  | Record<string, unknown>;

// ─── XML Builder ─────────────────────────────────────────────────────────────

/**
 * Build a PrestaShop XML request body.
 * Multilingual fields: pass an array of { id, value } objects.
 * Plain string values: passed as CDATA.
 */
export function buildXml(resource: string, fields: Record<string, PsValue>): string {
  const inner = objectToXml(fields);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<prestashop xmlns:xlink="http://www.w3.org/1999/xlink"><${resource}>${inner}</${resource}></prestashop>`;
}

function objectToXml(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([k, v]) => fieldToXml(k, v))
    .join("");
}

function fieldToXml(key: string, value: unknown): string {
  // Skip xlink:href — read-only attribute from PS responses
  if (key === "xlink:href") return "";

  if (value === null || value === undefined) return `<${key}/>`;

  if (Array.isArray(value)) {
    // Multilingual array: [{ id: 1, value: "text" }, ...]
    if (value.length > 0 && typeof value[0] === "object" && "value" in (value[0] as object)) {
      const inner = value
        .map((item: unknown) => {
          const it = item as { id: string | number; value: string };
          return `<language id="${it.id}"><![CDATA[${it.value}]]></language>`;
        })
        .join("");
      return `<${key}>${inner}</${key}>`;
    }
    // Regular array (associations, etc.)
    const inner = value
      .map((item: unknown) => {
        if (typeof item === "object" && item !== null) {
          return `<item>${objectToXml(item as Record<string, unknown>)}</item>`;
        }
        return `<item><![CDATA[${String(item)}]]></item>`;
      })
      .join("");
    return `<${key}>${inner}</${key}>`;
  }

  if (typeof value === "object") {
    return `<${key}>${objectToXml(value as Record<string, unknown>)}</${key}>`;
  }

  return `<${key}><![CDATA[${String(value)}]]></${key}>`;
}

// ─── PS JSON Normalization ────────────────────────────────────────────────────

/**
 * Normalize a PS JSON object for display:
 * - Multilingual arrays → first language value (or matching langId)
 * - Skips "associations" (too verbose for table display)
 * - Nested objects → JSON stringified
 */
export function normalizePsObject(
  obj: Record<string, unknown>,
  langId?: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "associations") continue;
    if (isMultilingualArray(v)) {
      const arr = v as Array<Record<string, unknown>>;
      const preferred = langId ? arr.find((l) => String(l.id) === langId) : null;
      result[k] = String((preferred ?? arr[0])?.value ?? "");
    } else if (Array.isArray(v)) {
      result[k] = JSON.stringify(v);
    } else if (typeof v === "object" && v !== null) {
      result[k] = JSON.stringify(v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

function isMultilingualArray(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    typeof v[0] === "object" &&
    v[0] !== null &&
    "id" in (v[0] as object) &&
    "value" in (v[0] as object)
  );
}

// ─── Response Unwrapping ─────────────────────────────────────────────────────

/** Unwrap PS JSON list response: { products: [...] } → [...] */
export function unwrapList(data: unknown, key: string): unknown[] {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (key in obj) {
      const val = obj[key];
      if (Array.isArray(val)) return val;
      if (val !== null && val !== undefined) return [val];
    }
  }
  return Array.isArray(data) ? data : [];
}

/** Unwrap PS JSON single response: { product: {...} } → {...} */
export function unwrapSingle(data: unknown, key: string): Record<string, unknown> {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (key in obj) return obj[key] as Record<string, unknown>;
  }
  return data as Record<string, unknown>;
}

// ─── Read-Modify-Write Helpers ────────────────────────────────────────────────

/**
 * Prepare an object fetched from PS for a PUT request:
 * - Remove xlink:href attributes (read-only)
 * - Keep associations (PS requires them in PUT body for some resources)
 */
export function prepareForPut(obj: Record<string, unknown>): Record<string, unknown> {
  return deepClean(obj);
}

function deepClean(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "xlink:href") continue;
    if (Array.isArray(v)) {
      result[k] = v.map((item) =>
        typeof item === "object" && item !== null
          ? deepClean(item as Record<string, unknown>)
          : item,
      );
    } else if (typeof v === "object" && v !== null) {
      result[k] = deepClean(v as Record<string, unknown>);
    } else {
      result[k] = v;
    }
  }
  return result;
}

// ─── --data Flag Parser ───────────────────────────────────────────────────────

/**
 * Parse --data argument: either inline JSON string or a file path.
 * File path: "path/to/file.json"
 * Inline JSON: '{"price": "9.99"}'
 */
export async function parseDataArg(data: string): Promise<Record<string, unknown>> {
  const trimmed = data.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      throw new Error("Invalid JSON in --data argument");
    }
  }
  try {
    const content = await Bun.file(trimmed).text();
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error(`Could not read or parse JSON from file: ${trimmed}`);
  }
}

// ─── List Param Builder ───────────────────────────────────────────────────────

type FilterSpec = string[]; // "field=value" or "field%=value%" etc.

/**
 * Build query params for PS list endpoints.
 * - limit: "offset,count" format (e.g. "0,25")
 * - sort: "[fieldname_ASC]" or "[fieldname_DESC]"
 * - filter[field]: "[value]"
 * - display: "full" by default
 * - date: "1" when sorting/filtering on date fields
 */
export function buildListParams(opts: {
  limit?: string;
  offset?: string;
  sort?: string;
  filter?: FilterSpec;
  display?: string;
  date?: boolean;
}): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {};

  const offset = opts.offset ?? "0";
  const limit = opts.limit ?? "25";
  params.limit = `${offset},${limit}`;

  params.display = opts.display ?? "full";

  if (opts.sort) {
    params.sort = `[${opts.sort}]`;
    // Auto-enable date param when sorting by date fields
    if (opts.sort.toLowerCase().includes("date")) params.date = "1";
  }

  if (opts.date) params.date = "1";

  if (opts.filter) {
    for (const f of opts.filter) {
      const eq = f.indexOf("=");
      if (eq > 0) {
        const field = f.slice(0, eq);
        const value = f.slice(eq + 1);
        // Allow suffix % for begins-with, prefix % for ends-with
        if (value.endsWith("%") || value.startsWith("%")) {
          params[`filter[${field}]`] = value;
        } else {
          params[`filter[${field}]`] = `[${value}]`;
        }
      }
    }
  }

  return params;
}
