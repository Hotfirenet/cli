import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";
import { buildListParams, normalizePsObject, unwrapList, unwrapSingle } from "../lib/xml.js";

const COLS = ["id", "name", "iso_code", "conversion_rate", "active", "deleted"];

export const currenciesResource = new Command("currencies").description(
  "List currencies",
);

// LIST
currenciesResource
  .command("list")
  .description("List all currencies")
  .option("--limit <n>", "Results per page", "50")
  .option("--offset <n>", "Pagination offset", "0")
  .option("--active", "Show only active currencies")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (opts) => {
    try {
      const filters: string[] = [];
      if (opts.active) filters.push("active=1");
      const params = buildListParams({ limit: opts.limit, offset: opts.offset, filter: filters });
      const data = await client.get("/currencies", params);
      const items = unwrapList(data, "currencies");
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
currenciesResource
  .command("get <id>")
  .description("Get a currency by ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/currencies/${id}`);
      const currency = unwrapSingle(data, "currency");
      output(normalizePsObject(currency), { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
