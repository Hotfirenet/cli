import { getToken, getBaseUrl } from "./config.js";
import { CliError } from "./errors.js";

const TIMEOUT_MS = 30_000;

function buildHeaders(): Record<string, string> {
  return {
    Accept: "application/json",
  };
}

// Google PageSpeed API uses key as query param, not header
function injectApiKey(params: Record<string, unknown>): Record<string, unknown> {
  const token = getToken();
  if (!token) throw new CliError(401, "No API key. Run: pagespeed-cli profile add --name default --url https://www.googleapis.com/pagespeedonline/v5 --token <api-key>");
  return { ...params, key: token };
}

async function request(method: string, path: string, opts: { params?: Record<string, unknown>; body?: unknown } = {}): Promise<unknown> {
  const url0 = getBaseUrl();
  let url = `${url0}${path}`;
  const allParams = injectApiKey(opts.params ?? {});
  const filtered = Object.fromEntries(
    Object.entries(allParams).filter(([, v]) => v !== undefined && v !== "")
  );
  if (Object.keys(filtered).length) url += `?${new URLSearchParams(filtered as Record<string, string>)}`;

  const res = await fetch(url, {
    method,
    headers: buildHeaders(),
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data as Record<string, unknown>)?.message ?? res.statusText;
    throw new CliError(res.status, `${res.status}: ${String(msg)}`);
  }
  return data;
}

export const client = {
  get: (path: string, params?: Record<string, unknown>) => request("GET", path, { params }),
  post: (path: string, body?: unknown) => request("POST", path, { body }),
  patch: (path: string, body?: unknown) => request("PATCH", path, { body }),
  put: (path: string, body?: unknown) => request("PUT", path, { body }),
  delete: (path: string) => request("DELETE", path),
};
