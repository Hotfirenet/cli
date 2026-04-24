import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";
import { buildListParams, normalizePsObject, unwrapList, unwrapSingle } from "../lib/xml.js";

const COLS = ["id", "name", "iso_code", "locale", "active", "is_rtl"];

export const languagesResource = new Command("languages").description(
  "List installed languages",
);

// LIST
languagesResource
  .command("list")
  .description("List all languages")
  .option("--limit <n>", "Results per page", "50")
  .option("--offset <n>", "Pagination offset", "0")
  .option("--active", "Show only active languages")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nTip: use the IDs shown here for multilingual fields in create/update commands.")
  .action(async (opts) => {
    try {
      const filters: string[] = [];
      if (opts.active) filters.push("active=1");
      const params = buildListParams({ limit: opts.limit, offset: opts.offset, filter: filters });
      const data = await client.get("/languages", params);
      const items = unwrapList(data, "languages");
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
languagesResource
  .command("get <id>")
  .description("Get a language by ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/languages/${id}`);
      const lang = unwrapSingle(data, "language");
      output(normalizePsObject(lang), { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
