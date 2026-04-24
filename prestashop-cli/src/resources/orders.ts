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

const COLS = ["id", "reference", "id_customer", "current_state", "payment", "total_paid_tax_incl", "date_add"];

function collect(val: string, prev: string[]) { return [...prev, val]; }

export const ordersResource = new Command("orders").description(
  "Manage orders",
);

// LIST
ordersResource
  .command("list")
  .description("List orders")
  .option("--limit <n>", "Results per page", "25")
  .option("--offset <n>", "Pagination offset", "0")
  .option("--sort <field>", "Sort field, e.g. id_DESC or date_add_ASC", "id_DESC")
  .option("--filter <expr>", "Filter: field=value (repeatable)", collect, [] as string[])
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", `
Examples:
  prestashop-cli orders list
  prestashop-cli orders list --filter "current_state=2" --limit 10
  prestashop-cli orders list --sort date_add_DESC --json`)
  .action(async (opts) => {
    try {
      const params = buildListParams({ limit: opts.limit, offset: opts.offset, sort: opts.sort, filter: opts.filter, date: true });
      const data = await client.get("/orders", params);
      const items = unwrapList(data, "orders");
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
ordersResource
  .command("get <id>")
  .description("Get an order by ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  prestashop-cli orders get 42")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/orders/${id}`);
      const order = unwrapSingle(data, "order");
      output(normalizePsObject(order), { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// UPDATE
ordersResource
  .command("update <id>")
  .description("Update an order (read-modify-write)")
  .option("--status <state_id>", "Set order state ID (see: prestashop-cli order-states list)")
  .option("--data <json>", "JSON fields to merge, or path to JSON file")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  prestashop-cli orders update 42 --status 5
  prestashop-cli orders update 42 --data '{"note":"VIP customer"}'

Tip: use 'prestashop-cli order-states list' to see available status IDs.`)
  .action(async (id, opts) => {
    try {
      const current = unwrapSingle(await client.get(`/orders/${id}`), "order");
      const base = prepareForPut(current);

      if (opts.status !== undefined) base.current_state = opts.status;

      if (opts.data) {
        const changes = await parseDataArg(opts.data);
        Object.assign(base, changes);
      }

      const xml = buildXml("order", base as Record<string, never>);
      const result = await client.put(`/orders/${id}`, xml);
      const updated = unwrapSingle(result, "order");
      output(normalizePsObject(updated), { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// SCHEMA
ordersResource
  .command("schema")
  .description("Show the blank order schema")
  .option("--synopsis", "Show synopsis with field types")
  .action(async (opts) => {
    try {
      const xml = await client.getRaw("/orders", { schema: opts.synopsis ? "synopsis" : "blank" });
      console.log(xml);
    } catch (err) {
      handleError(err);
    }
  });
