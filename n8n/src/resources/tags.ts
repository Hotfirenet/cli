import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const tagsResource = new Command("tags")
  .description("Manage workflow tags");

tagsResource
  .command("list")
  .description("List all tags")
  .option("--limit <n>", "Max results", "100")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const params: Record<string, unknown> = { limit: opts.limit };
      if (opts.cursor) params.cursor = opts.cursor;
      const data = await client.get("/tags", params);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

tagsResource
  .command("get <id>")
  .description("Get a tag by ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/tags/${id}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

tagsResource
  .command("create <name>")
  .description("Create a tag")
  .option("--json", "Output as JSON")
  .action(async (name, opts) => {
    try {
      const data = await client.post("/tags", { name });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

tagsResource
  .command("update <id> <name>")
  .description("Rename a tag")
  .option("--json", "Output as JSON")
  .action(async (id, name, opts) => {
    try {
      const data = await client.put(`/tags/${id}`, { name });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

tagsResource
  .command("delete <id>")
  .description("Delete a tag")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/tags/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
