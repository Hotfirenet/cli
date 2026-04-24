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

const COLS = ["id", "id_product", "reference", "ean13", "price", "weight", "default_on"];

function collect(val: string, prev: string[]) { return [...prev, val]; }

export const combinationsResource = new Command("combinations").description(
  "Manage product combinations (variants)",
);

// LIST
combinationsResource
  .command("list")
  .description("List combinations")
  .option("--limit <n>", "Results per page", "25")
  .option("--offset <n>", "Pagination offset", "0")
  .option("--sort <field>", "Sort field", "id_DESC")
  .option("--filter <expr>", "Filter: field=value (repeatable)", collect, [] as string[])
  .option("--product <id>", "Filter by product ID (shorthand for --filter id_product=<id>)")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", `
Examples:
  prestashop-cli combinations list --product 42
  prestashop-cli combinations list --filter "id_product=42" --json`)
  .action(async (opts) => {
    try {
      const filters = [...(opts.filter as string[])];
      if (opts.product) filters.push(`id_product=${opts.product}`);
      const params = buildListParams({ limit: opts.limit, offset: opts.offset, sort: opts.sort, filter: filters });
      const data = await client.get("/combinations", params);
      const items = unwrapList(data, "combinations");
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
combinationsResource
  .command("get <id>")
  .description("Get a combination by ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/combinations/${id}`);
      const combo = unwrapSingle(data, "combination");
      output(normalizePsObject(combo), { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// UPDATE
combinationsResource
  .command("update <id>")
  .description("Update a combination (read-modify-write)")
  .option("--reference <ref>", "Update reference")
  .option("--price <price>", "Price impact (relative to product price, can be negative)")
  .option("--data <json>", "JSON fields to merge, or path to JSON file")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  prestashop-cli combinations update 5 --reference "SKU-XL-BLUE"
  prestashop-cli combinations update 5 --price "2.00"`)
  .action(async (id, opts) => {
    try {
      const current = unwrapSingle(await client.get(`/combinations/${id}`), "combination");
      const base = prepareForPut(current);

      if (opts.reference !== undefined) base.reference = opts.reference;
      if (opts.price !== undefined) base.price = opts.price;

      if (opts.data) {
        const changes = await parseDataArg(opts.data);
        Object.assign(base, changes);
      }

      const xml = buildXml("combination", base as Record<string, never>);
      const result = await client.put(`/combinations/${id}`, xml);
      const updated = unwrapSingle(result, "combination");
      output(normalizePsObject(updated), { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// SCHEMA
combinationsResource
  .command("schema")
  .description("Show the blank combination schema")
  .option("--synopsis", "Show synopsis with field types")
  .action(async (opts) => {
    try {
      const xml = await client.getRaw("/combinations", { schema: opts.synopsis ? "synopsis" : "blank" });
      console.log(xml);
    } catch (err) {
      handleError(err);
    }
  });
