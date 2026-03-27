import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";
import { readFileSync } from "fs";

export const workflowsResource = new Command("workflows")
  .description("Manage n8n workflows");

workflowsResource
  .command("list")
  .description("List all workflows")
  .option("--active", "Filter active workflows only")
  .option("--limit <n>", "Max results", "100")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--tags <tags>", "Filter by tag names (comma-separated)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const params: Record<string, unknown> = { limit: opts.limit };
      if (opts.active) params.active = true;
      if (opts.cursor) params.cursor = opts.cursor;
      if (opts.tags) params.tags = opts.tags;
      const data = await client.get("/workflows", params);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

workflowsResource
  .command("get <id>")
  .description("Get a workflow by ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/workflows/${id}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

workflowsResource
  .command("create <file>")
  .description("Create a workflow from a JSON file")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  n8n-cli workflows create ./my-workflow.json")
  .action(async (file, opts) => {
    try {
      const body = JSON.parse(readFileSync(file, "utf-8"));
      const data = await client.post("/workflows", body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

workflowsResource
  .command("update <id> <file>")
  .description("Update a workflow from a JSON file")
  .option("--json", "Output as JSON")
  .action(async (id, file, opts) => {
    try {
      const body = JSON.parse(readFileSync(file, "utf-8"));
      const data = await client.put(`/workflows/${id}`, body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

workflowsResource
  .command("delete <id>")
  .description("Delete a workflow")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/workflows/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

workflowsResource
  .command("activate <id>")
  .description("Activate a workflow")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.post(`/workflows/${id}/activate`, {});
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

workflowsResource
  .command("deactivate <id>")
  .description("Deactivate a workflow")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.post(`/workflows/${id}/deactivate`, {});
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

workflowsResource
  .command("export <id>")
  .description("Export a workflow as JSON to stdout or file")
  .option("--out <file>", "Save to file instead of stdout")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/workflows/${id}`);
      const json = JSON.stringify(data, null, 2);
      if (opts.out) {
        const { writeFileSync } = await import("fs");
        writeFileSync(opts.out, json, "utf-8");
        console.log(`Exported to ${opts.out}`);
      } else {
        console.log(json);
      }
    } catch (err) { handleError(err, false); }
  });

workflowsResource
  .command("transfer <id>")
  .description("Transfer a workflow to another project")
  .argument("<destination-project-id>", "Target project ID")
  .option("--json", "Output as JSON")
  .action(async (id, destinationProjectId, opts) => {
    try {
      const data = await client.put(`/workflows/${id}/transfer`, { destinationProjectId });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
