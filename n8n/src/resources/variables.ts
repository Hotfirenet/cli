import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const variablesResource = new Command("variables")
  .description("Manage n8n environment variables");

variablesResource
  .command("list")
  .description("List all variables")
  .option("--limit <n>", "Max results", "100")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const params: Record<string, unknown> = { limit: opts.limit };
      if (opts.cursor) params.cursor = opts.cursor;
      const data = await client.get("/variables", params);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

variablesResource
  .command("create <key> <value>")
  .description("Create a variable")
  .option("--type <type>", "Variable type: string, number, boolean, secret", "string")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  n8n-cli variables create MY_API_KEY abc123 --type secret")
  .action(async (key, value, opts) => {
    try {
      const data = await client.post("/variables", { key, value, type: opts.type });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

variablesResource
  .command("delete <id>")
  .description("Delete a variable by ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/variables/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
