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
} from "../lib/xml.js";

const COLS = ["id", "id_product", "id_product_attribute", "id_shop", "quantity", "depends_on_stock", "out_of_stock"];

function collect(val: string, prev: string[]) { return [...prev, val]; }

export const stockResource = new Command("stock").description(
  "Manage stock availability (stock_availables)",
);

// LIST
stockResource
  .command("list")
  .description("List stock availability records")
  .option("--limit <n>", "Results per page", "50")
  .option("--offset <n>", "Pagination offset", "0")
  .option("--filter <expr>", "Filter: field=value (repeatable)", collect, [] as string[])
  .option("--product <id>", "Filter by product ID (shorthand for --filter id_product=<id>)")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", `
Examples:
  prestashop-cli stock list --product 42
  prestashop-cli stock list --filter "quantity=[0,10]" --json   # quantity between 0 and 10`)
  .action(async (opts) => {
    try {
      const filters = [...(opts.filter as string[])];
      if (opts.product) filters.push(`id_product=${opts.product}`);
      const params = buildListParams({ limit: opts.limit, offset: opts.offset, filter: filters });
      const data = await client.get("/stock_availables", params);
      const items = unwrapList(data, "stock_availables");
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
stockResource
  .command("get <id>")
  .description("Get a stock_available record by ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nTip: use 'stock list --product <id>' to find the stock record ID for a product.")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/stock_availables/${id}`);
      const stock = unwrapSingle(data, "stock_available");
      output(normalizePsObject(stock), { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// UPDATE (qty shortcut)
stockResource
  .command("update <id>")
  .description("Update a stock record (read-modify-write)")
  .option("--qty <n>", "Set available quantity")
  .option("--out-of-stock <0|1|2>", "Out of stock behavior: 0=deny orders, 1=allow orders, 2=use default")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  prestashop-cli stock update 12 --qty 100
  prestashop-cli stock update 12 --qty 0 --out-of-stock 1

Tip: find the stock record ID with: prestashop-cli stock list --product <product_id>`)
  .action(async (id, opts) => {
    try {
      const current = unwrapSingle(await client.get(`/stock_availables/${id}`), "stock_available");
      const base = prepareForPut(current);

      if (opts.qty !== undefined) base.quantity = opts.qty;
      if (opts.outOfStock !== undefined) base.out_of_stock = opts.outOfStock;

      const xml = buildXml("stock_available", base as Record<string, never>);
      const result = await client.put(`/stock_availables/${id}`, xml);
      const updated = unwrapSingle(result, "stock_available");
      output(normalizePsObject(updated), { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
