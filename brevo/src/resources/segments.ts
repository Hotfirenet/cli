import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const segmentsResource = new Command("segments")
  .description("Manage contact segments");

segmentsResource
  .command("list")
  .description("List all segments")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset", "0")
  .option("--sort <order>", "Sort: asc or desc", "desc")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const data = await client.get("/contacts/segments", { limit: opts.limit, offset: opts.offset, sort: opts.sort });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });
