import { Command } from "commander";
import { client } from "../lib/client.js";
import { output, handleError } from "../lib/output.js";

function parseFilters(filters: string[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const f of filters) {
    const eq = f.indexOf("=");
    if (eq === -1) throw new Error(`Invalid filter "${f}". Use col=op.value (e.g. id=eq.1)`);
    params[f.slice(0, eq)] = f.slice(eq + 1);
  }
  return params;
}

export const tableResource = new Command("table")
  .description("Generic CRUD on any Supabase table via PostgREST")
  .addHelpText("after", `
Examples:
  supabase-cli table list users
  supabase-cli table list orders --filter status=eq.active --limit 50
  supabase-cli table get profiles --filter id=eq.abc-123
  supabase-cli table insert products --data '{"name":"Widget","price":9.99}'
  supabase-cli table update orders --filter id=eq.1 --data '{"status":"shipped"}'
  supabase-cli table delete sessions --filter user_id=eq.abc-123
  supabase-cli table count users
`);

tableResource
  .command("list <table>")
  .description("Fetch rows from a table")
  .option("--filter <expr...>", "PostgREST filter(s), e.g. status=eq.active")
  .option("--select <cols>", "Columns to return (default: *)", "*")
  .option("--limit <n>", "Max rows", "100")
  .option("--offset <n>", "Skip rows", "0")
  .option("--order <col>", "Order by column (append .desc for descending)")
  .action(async (table, opts) => {
    try {
      const params: Record<string, string | undefined> = {
        select: opts.select,
        limit: opts.limit,
        offset: opts.offset,
        order: opts.order,
        ...parseFilters(opts.filter ?? []),
      };
      const data = await client.get(`/rest/v1/${table}`, params);
      output(data, { label: table });
    } catch (e) { handleError(e); }
  });

tableResource
  .command("get <table>")
  .description("Fetch a single row (use --filter to identify it)")
  .option("--filter <expr...>", "PostgREST filter(s), e.g. id=eq.123")
  .option("--select <cols>", "Columns to return", "*")
  .action(async (table, opts) => {
    try {
      const params: Record<string, string | undefined> = {
        select: opts.select,
        limit: "1",
        ...parseFilters(opts.filter ?? []),
      };
      const data = await client.get(`/rest/v1/${table}`, params) as unknown[];
      output(Array.isArray(data) ? data[0] ?? null : data, { label: table });
    } catch (e) { handleError(e); }
  });

tableResource
  .command("insert <table>")
  .description("Insert a new row")
  .requiredOption("--data <json>", "Row data as JSON object")
  .action(async (table, opts) => {
    try {
      const body = JSON.parse(opts.data);
      const data = await client.post(`/rest/v1/${table}`, body, "return=representation");
      output(data, { label: table });
    } catch (e) { handleError(e); }
  });

tableResource
  .command("update <table>")
  .description("Update rows matching the filter")
  .requiredOption("--filter <expr...>", "PostgREST filter(s), e.g. id=eq.123")
  .requiredOption("--data <json>", "Fields to update as JSON object")
  .action(async (table, opts) => {
    try {
      const body = JSON.parse(opts.data);
      const params = parseFilters(opts.filter);
      const data = await client.patch(`/rest/v1/${table}`, body, "return=representation", params);
      output(data, { label: table });
    } catch (e) { handleError(e); }
  });

tableResource
  .command("delete <table>")
  .description("Delete rows matching the filter")
  .requiredOption("--filter <expr...>", "PostgREST filter(s), e.g. id=eq.123")
  .option("--confirm", "Skip confirmation prompt")
  .action(async (table, opts) => {
    try {
      const params = parseFilters(opts.filter);
      await client.delete(`/rest/v1/${table}`, params);
      console.log(`Deleted from ${table} where ${opts.filter.join(", ")}`);
    } catch (e) { handleError(e); }
  });

tableResource
  .command("count <table>")
  .description("Count rows (uses HEAD + Content-Range)")
  .option("--filter <expr...>", "PostgREST filter(s)")
  .action(async (table, opts) => {
    try {
      const params: Record<string, string | undefined> = {
        select: "id",
        ...parseFilters(opts.filter ?? []),
      };
      const res = await client.head(`/rest/v1/${table}`, params, { Prefer: "count=exact" });
      const range = res.headers.get("content-range");
      const total = range?.split("/")?.[1];
      output({ table, count: total ? parseInt(total) : "unknown" }, { label: "count" });
    } catch (e) { handleError(e); }
  });
