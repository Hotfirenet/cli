import { globalFlags } from "./config.js";

export function output(data: unknown, opts: { json?: boolean; format?: string } = {}): void {
  const useJson = opts.json || globalFlags.json || opts.format === "json";
  if (useJson || data === null || typeof data !== "object") {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  console.log(JSON.stringify(data, null, 2));
}
