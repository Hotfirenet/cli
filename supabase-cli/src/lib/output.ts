import pc from "picocolors";
import { globalFlags } from "./config.js";
import { CliError } from "./errors.js";

export interface OutputOpts {
  label?: string;
  json?: boolean;
  format?: string;
}

export function output(data: unknown, opts: OutputOpts = {}): void {
  const fmt = opts.format ?? globalFlags.format;
  const useJson = opts.json || globalFlags.json || fmt === "json";

  if (useJson) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (data === null || data === undefined) {
    console.log(pc.gray("(empty)"));
    return;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) { console.log(pc.gray("(no results)")); return; }
    if (fmt === "csv") {
      const keys = Object.keys(data[0] as object);
      if (!globalFlags.noHeader) console.log(keys.join(","));
      for (const row of data) console.log(keys.map(k => JSON.stringify((row as Record<string, unknown>)[k] ?? "")).join(","));
      return;
    }
    // Default: JSON pretty
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (typeof data === "object") {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  console.log(String(data));
}

export function handleError(e: unknown): never {
  if (e instanceof CliError) {
    console.error(pc.red(`Error ${e.statusCode}: ${e.message}`));
  } else if (e instanceof SyntaxError) {
    console.error(pc.red(`Invalid JSON: ${e.message}`));
  } else {
    console.error(pc.red(String(e)));
  }
  process.exit(1);
}
