import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const executionsResource = new Command("executions")
  .description("Manage workflow executions");

executionsResource
  .command("list")
  .description("List executions")
  .option("--workflow-id <id>", "Filter by workflow ID")
  .option("--status <status>", "Filter by status: success, error, waiting, running")
  .option("--limit <n>", "Max results", "20")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--include-data", "Include execution data (larger response)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const params: Record<string, unknown> = { limit: opts.limit };
      if (opts.workflowId) params.workflowId = opts.workflowId;
      if (opts.status) params.status = opts.status;
      if (opts.cursor) params.cursor = opts.cursor;
      if (opts.includeData) params.includeData = true;
      const data = await client.get("/executions", params);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

executionsResource
  .command("get <id>")
  .description("Get an execution by ID")
  .option("--include-data", "Include full execution data")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const params: Record<string, unknown> = {};
      if (opts.includeData) params.includeData = true;
      const data = await client.get(`/executions/${id}`, params);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

executionsResource
  .command("delete <id>")
  .description("Delete an execution")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/executions/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

executionsResource
  .command("retry <id>")
  .description("Retry a failed execution")
  .option("--load-workflow", "Load latest workflow version instead of saved one")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.loadWorkflow) body.loadWorkflow = true;
      const data = await client.post(`/executions/${id}/retry`, body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

executionsResource
  .command("stop <id>")
  .description("Stop a running execution")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.post(`/executions/${id}/stop`, {});
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
