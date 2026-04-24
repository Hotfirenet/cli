import { getToken, getBaseUrl } from "./config.js";
import { CliError } from "./errors.js";

const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

interface RequestOpts {
  params?: Record<string, string | undefined>;
  body?: unknown;
  prefer?: string;
  /** Override Accept header (e.g. for storage binary downloads) */
  accept?: string;
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken();
  if (!token) throw new CliError(401, "No key configured. Run: supabase-cli profile add --name default --url <project-url> --token <service_role-key>");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    apikey: token,
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function request(method: string, path: string, opts: RequestOpts = {}): Promise<unknown> {
  const base = getBaseUrl();
  let url = `${base}${path}`;

  if (opts.params) {
    const filtered = Object.entries(opts.params).filter(([, v]) => v !== undefined && v !== "") as [string, string][];
    if (filtered.length) url += `?${new URLSearchParams(filtered).toString()}`;
  }

  const extraHeaders: Record<string, string> = {};
  if (opts.prefer) extraHeaders["Prefer"] = opts.prefer;
  if (opts.accept) extraHeaders["Accept"] = opts.accept;

  const headers = buildHeaders(extraHeaders);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
      await Bun.sleep(RETRY_DELAYS[attempt] ?? 4000);
      continue;
    }

    if (res.status === 204) return null;

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      let msg = res.statusText;
      try { msg = (JSON.parse(text) as Record<string, unknown>).message as string ?? msg; } catch {}
      throw new CliError(res.status, `${res.status}: ${msg}`);
    }
    if (!text) return null;
    try { return JSON.parse(text); } catch { return text; }
  }

  throw new CliError(500, "Max retries exceeded");
}

async function head(path: string, params?: Record<string, string | undefined>, extra?: Record<string, string>): Promise<Response> {
  const base = getBaseUrl();
  let url = `${base}${path}`;
  if (params) {
    const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== "") as [string, string][];
    if (filtered.length) url += `?${new URLSearchParams(filtered).toString()}`;
  }
  return fetch(url, { method: "HEAD", headers: buildHeaders(extra), signal: AbortSignal.timeout(TIMEOUT_MS) });
}

export const client = {
  get: (path: string, params?: Record<string, string | undefined>) => request("GET", path, { params }),
  post: (path: string, body?: unknown, prefer?: string) => request("POST", path, { body, prefer }),
  patch: (path: string, body?: unknown, prefer?: string, params?: Record<string, string | undefined>) =>
    request("PATCH", path, { body, prefer, params }),
  delete: (path: string, params?: Record<string, string | undefined>) => request("DELETE", path, { params }),
  head,
};
