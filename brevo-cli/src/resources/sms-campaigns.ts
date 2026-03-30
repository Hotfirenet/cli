import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const smsCampaignsResource = new Command("sms-campaigns")
  .description("Manage SMS marketing campaigns");

smsCampaignsResource
  .command("list")
  .description("List all SMS campaigns")
  .option("--status <status>", "Filter by status: draft, sent, archive, queued, suspended, in_process")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset", "0")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const data = await client.get("/smsCampaigns", {
        limit: opts.limit, offset: opts.offset,
        ...(opts.status && { status: opts.status }),
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

smsCampaignsResource
  .command("get")
  .description("Get an SMS campaign by ID")
  .argument("<id>", "Campaign ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/smsCampaigns/${id}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

smsCampaignsResource
  .command("send")
  .description("Send an SMS campaign immediately")
  .argument("<id>", "Campaign ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.post(`/smsCampaigns/${id}/sendNow`, {});
      output({ sent: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

smsCampaignsResource
  .command("delete")
  .description("Delete an SMS campaign")
  .argument("<id>", "Campaign ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/smsCampaigns/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
