import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const campaignsResource = new Command("campaigns")
  .description("Manage email marketing campaigns");

// LIST
campaignsResource
  .command("list")
  .description("List all email campaigns")
  .option("--status <status>", "Filter by status: draft, sent, archive, queued, suspended, in_process")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset for pagination", "0")
  .option("--sort <order>", "Sort order: asc or desc", "desc")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExamples:\n  brevo-cli campaigns list\n  brevo-cli campaigns list --status sent --json")
  .action(async (opts) => {
    try {
      const data = await client.get("/emailCampaigns", {
        limit: opts.limit,
        offset: opts.offset,
        sort: opts.sort,
        ...(opts.status && { status: opts.status }),
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// GET
campaignsResource
  .command("get")
  .description("Get a campaign by ID")
  .argument("<id>", "Campaign ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli campaigns get 12")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/emailCampaigns/${id}`);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// STATS
campaignsResource
  .command("stats")
  .description("Get statistics for a campaign")
  .argument("<id>", "Campaign ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli campaigns stats 12 --json")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/emailCampaigns/${id}`);
      output((data as Record<string, unknown>).statistics ?? data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// SEND
campaignsResource
  .command("send")
  .description("Send an existing campaign now")
  .argument("<id>", "Campaign ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli campaigns send 12")
  .action(async (id, opts) => {
    try {
      await client.post(`/emailCampaigns/${id}/sendNow`, {});
      output({ sent: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// DELETE
campaignsResource
  .command("delete")
  .description("Delete a campaign by ID")
  .argument("<id>", "Campaign ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli campaigns delete 12")
  .action(async (id, opts) => {
    try {
      await client.delete(`/emailCampaigns/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
