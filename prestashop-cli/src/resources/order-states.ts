import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";
import { buildListParams, normalizePsObject, unwrapList, unwrapSingle } from "../lib/xml.js";

const COLS = ["id", "name", "color", "paid", "shipped", "delivery", "invoice", "send_email"];

export const orderStatesResource = new Command("order-states").description(
  "List order state definitions",
);

// LIST
orderStatesResource
  .command("list")
  .description("List all order states")
  .option("--limit <n>", "Results per page", "100")
  .option("--offset <n>", "Pagination offset", "0")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nTip: use the IDs shown here with: prestashop-cli orders update <id> --status <state_id>")
  .action(async (opts) => {
    try {
      const params = buildListParams({ limit: opts.limit, offset: opts.offset });
      const data = await client.get("/order_states", params);
      const items = unwrapList(data, "order_states");
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
orderStatesResource
  .command("get <id>")
  .description("Get an order state by ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/order_states/${id}`);
      const state = unwrapSingle(data, "order_state");
      output(normalizePsObject(state), { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
