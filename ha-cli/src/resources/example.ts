import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const exampleResource = new Command("example")
  .description("Example resource — replace this with your first resource");

exampleResource
  .command("list")
  .description("List all items")
  .option("--limit <n>", "Max results", "50")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.get("/items", { limit: opts.limit });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
