import { buildAuthHeaders } from "./auth.js";
import { getBaseUrl } from "./config.js";
import { CliError } from "./errors.js";
import { log } from "./logger.js";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];
const TIMEOUT_MS = 30_000;

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  params?: Record<string, string | undefined>;
  body?: string;
  timeout?: number;
  raw?: boolean; // Return raw text instead of parsed JSON
}

async function request(
  method: Method,
  path: string,
  opts: RequestOptions = {},
): Promise<unknown> {
  const params: Record<string, string> = {};

  if (method === "GET" && !opts.raw) {
    params.output_format = "JSON";
  }

  if (opts.params) {
    for (const [k, v] of Object.entries(opts.params)) {
      if (v !== undefined && v !== "") params[k] = v;
    }
  }

  let url = `${getBaseUrl()}${path}`;
  if (Object.keys(params).length > 0) {
    url += `?${new URLSearchParams(params).toString()}`;
  }

  const headers: Record<string, string> = {
    ...buildAuthHeaders(),
    ...(method === "GET" ? { Accept: "application/json" } : { "Content-Type": "text/xml" }),
  };

  const fetchOpts: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(opts.timeout ?? TIMEOUT_MS),
    ...(opts.body ? { body: opts.body } : {}),
  };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    log.debug(`${method} ${url}${attempt > 0 ? ` (retry ${attempt})` : ""}`);

    const res = await fetch(url, fetchOpts);

    if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
      const delay = RETRY_DELAYS[attempt] ?? 4000;
      log.warn(`${res.status} — retrying in ${delay / 1000}s...`);
      await Bun.sleep(delay);
      continue;
    }

    if (res.status === 204) return null;

    const text = await res.text().catch(() => "");

    if (!res.ok) {
      // Try to extract error message from PS XML error response
      const match = text.match(/<message><!\[CDATA\[(.+?)\]\]><\/message>/s);
      const msg = match?.[1] ?? res.statusText ?? `HTTP ${res.status}`;
      throw new CliError(res.status, `${res.status}: ${msg.trim()}`);
    }

    if (!text) return null;
    if (opts.raw) return text;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  throw new CliError(500, "Max retries exceeded");
}

export const client = {
  /** GET with output_format=JSON automatically appended */
  get(path: string, params?: Record<string, string | undefined>) {
    return request("GET", path, { params });
  },

  /** GET returning raw response text (for schema, images, etc.) */
  getRaw(path: string, params?: Record<string, string | undefined>): Promise<string> {
    return request("GET", path, { params, raw: true }) as Promise<string>;
  },

  /** POST with XML body */
  post(path: string, body: string) {
    return request("POST", path, { body });
  },

  /** PUT with XML body */
  put(path: string, body: string) {
    return request("PUT", path, { body });
  },

  /** DELETE */
  delete(path: string) {
    return request("DELETE", path);
  },
};
