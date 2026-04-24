import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";
import {
  buildXml,
  buildListParams,
  normalizePsObject,
  unwrapList,
  unwrapSingle,
  prepareForPut,
  parseDataArg,
} from "../lib/xml.js";

const COLS = ["id", "name", "active", "deleted", "is_free", "shipping_method", "max_weight"];

function collect(val: string, prev: string[]) { return [...prev, val]; }

export const carriersResource = new Command("carriers").description(
  "Manage carriers (shipping methods)",
);

// LIST
carriersResource
  .command("list")
  .description("List carriers")
  .option("--limit <n>", "Results per page", "50")
  .option("--offset <n>", "Pagination offset", "0")
  .option("--filter <expr>", "Filter: field=value (repeatable)", collect, [] as string[])
  .option("--active", "Show only active carriers (shorthand for --filter active=1)")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", `
Examples:
  prestashop-cli carriers list
  prestashop-cli carriers list --active`)
  .action(async (opts) => {
    try {
      const filters = [...(opts.filter as string[])];
      if (opts.active) filters.push("active=1");
      const params = buildListParams({ limit: opts.limit, offset: opts.offset, filter: filters });
      const data = await client.get("/carriers", params);
      const items = unwrapList(data, "carriers");
      const rows = items.map((item) => {
        const n = normalizePsObject(item as Record<string, unknown>);
        return Object.fromEntries(COLS.filter((c) => c in n).map((c) => [c, n[c]]));
      });
      output(rows, { json: opts.json, format: opts.format, fields: opts.fields?.split(",") });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// GET
carriersResource
  .command("get <id>")
  .description("Get a carrier by ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/carriers/${id}`);
      const carrier = unwrapSingle(data, "carrier");
      output(normalizePsObject(carrier), { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// UPDATE
carriersResource
  .command("update <id>")
  .description("Update a carrier (read-modify-write)")
  .option("--active <0|1>", "Enable or disable the carrier")
  .option("--data <json>", "JSON fields to merge, or path to JSON file")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const current = unwrapSingle(await client.get(`/carriers/${id}`), "carrier");
      const base = prepareForPut(current);

      if (opts.active !== undefined) base.active = opts.active;

      if (opts.data) {
        const changes = await parseDataArg(opts.data);
        Object.assign(base, changes);
      }

      const xml = buildXml("carrier", base as Record<string, never>);
      const result = await client.put(`/carriers/${id}`, xml);
      const updated = unwrapSingle(result, "carrier");
      output(normalizePsObject(updated), { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// SCHEMA
carriersResource
  .command("schema")
  .description("Show the blank carrier schema")
  .option("--synopsis", "Show synopsis with field types")
  .action(async (opts) => {
    try {
      const xml = await client.getRaw("/carriers", { schema: opts.synopsis ? "synopsis" : "blank" });
      console.log(xml);
    } catch (err) {
      handleError(err);
    }
  });
