import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const historyResource = new Command("history").description("Query entity history and logbook");

historyResource
  .command("get")
  .description("Get state history for entities")
  .option("--entity <entity_id>", "Filter by entity ID")
  .option("--from <timestamp>", "Start time (ISO 8601, default: 1 day ago)")
  .option("--to <timestamp>", "End time (ISO 8601)")
  .option("--significant", "Only significant state changes")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const from = opts.from ?? new Date(Date.now() - 86400000).toISOString();
      const params: Record<string, unknown> = {};
      if (opts.entity) params.filter_entity_id = opts.entity;
      if (opts.to) params.end_time = opts.to;
      if (opts.significant) params.significant_changes_only = true;
      const data = await client.get(`/history/period/${from}`, params);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

historyResource
  .command("logbook")
  .description("Get logbook entries")
  .option("--entity <entity_id>", "Filter by entity ID")
  .option("--from <timestamp>", "Start time (ISO 8601, default: 1 day ago)")
  .option("--to <timestamp>", "End time (ISO 8601)")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const from = opts.from ?? new Date(Date.now() - 86400000).toISOString();
      const params: Record<string, unknown> = {};
      if (opts.entity) params.entity = opts.entity;
      if (opts.to) params.end_time = opts.to;
      const data = await client.get(`/logbook/${from}`, params);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
