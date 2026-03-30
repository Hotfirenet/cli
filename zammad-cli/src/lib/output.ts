import { globalFlags } from "./config.js";

// ─── Table renderer ──────────────────────────────────────────────────────────

export function printTable(rows: Record<string, unknown>[], columns: string[], title?: string): void {
  if (!rows.length) { console.log(title ? `${title}: (no results)` : "(no results)"); return; }

  const widths: Record<string, number> = {};
  for (const col of columns) widths[col] = col.length;
  for (const row of rows) {
    for (const col of columns) {
      const v = String(row[col] ?? "");
      if (v.length > widths[col]) widths[col] = Math.min(v.length, 80);
    }
  }

  const sep = columns.map(c => "─".repeat(widths[c])).join("─┼─");
  const header = columns.map(c => c.toUpperCase().padEnd(widths[c])).join(" │ ");

  if (title) console.log(`\n${title}`);
  console.log(header);
  console.log(sep);
  for (const row of rows) {
    console.log(columns.map(c => String(row[c] ?? "").slice(0, 80).padEnd(widths[c])).join(" │ "));
  }
  console.log(`\n${rows.length} row(s)`);
}

export function printRecord(data: Record<string, unknown>, fields?: string[], title?: string): void {
  if (title) console.log(`\n─── ${title} ───`);
  const keys = fields ?? Object.keys(data);
  const keyWidth = Math.max(...keys.map(k => k.length));
  for (const k of keys) {
    const v = data[k];
    if (v === undefined || v === null) continue;
    const val = typeof v === "object" ? JSON.stringify(v) : String(v);
    console.log(`  ${k.padEnd(keyWidth)}  ${val}`);
  }
}

// ─── Generic output ───────────────────────────────────────────────────────────

export function output(data: unknown, opts: { json?: boolean } = {}): void {
  const useJson = opts.json || globalFlags.json;
  if (useJson) { console.log(JSON.stringify(data, null, 2)); return; }
  console.log(JSON.stringify(data, null, 2));
}

export function success(msg: string): void {
  console.log(`✓ ${msg}`);
}

export function warn(msg: string): void {
  console.error(`⚠ ${msg}`);
}
