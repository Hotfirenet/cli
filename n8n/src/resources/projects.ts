import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const projectsResource = new Command("projects")
  .description("Manage n8n projects");

projectsResource
  .command("list")
  .description("List all projects")
  .option("--limit <n>", "Max results", "100")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const params: Record<string, unknown> = { limit: opts.limit };
      if (opts.cursor) params.cursor = opts.cursor;
      const data = await client.get("/projects", params);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

projectsResource
  .command("create <name>")
  .description("Create a project")
  .option("--json", "Output as JSON")
  .action(async (name, opts) => {
    try {
      const data = await client.post("/projects", { name });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

projectsResource
  .command("update <id>")
  .description("Update a project")
  .requiredOption("--name <name>", "New project name")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.put(`/projects/${id}`, { name: opts.name });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

projectsResource
  .command("delete <id>")
  .description("Delete a project")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/projects/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
