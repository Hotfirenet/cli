import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const whatsappCampaignsResource = new Command("whatsapp-campaigns")
  .description("Manage WhatsApp marketing campaigns");

whatsappCampaignsResource
  .command("list")
  .description("List all WhatsApp campaigns")
  .option("--start-date <date>", "Start date (YYYY-MM-DD)")
  .option("--end-date <date>", "End date (YYYY-MM-DD)")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset", "0")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const params: Record<string, unknown> = { limit: opts.limit, offset: opts.offset };
      if (opts.startDate) params.startDate = opts.startDate;
      if (opts.endDate) params.endDate = opts.endDate;
      const data = await client.get("/whatsappCampaigns", params);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

whatsappCampaignsResource
  .command("get")
  .description("Get a WhatsApp campaign by ID")
  .argument("<id>", "Campaign ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/whatsappCampaigns/${id}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

whatsappCampaignsResource
  .command("create")
  .description("Create a WhatsApp campaign")
  .requiredOption("--name <name>", "Campaign name")
  .requiredOption("--template-id <id>", "WhatsApp template ID")
  .requiredOption("--sender-id <id>", "WhatsApp sender ID")
  .option("--scheduled-at <date>", "Schedule date (ISO 8601)")
  .option("--recipients <json>", "Recipients as JSON (e.g. {\"listIds\":[1,2]})")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli whatsapp-campaigns create --name \"Promo\" --template-id 12 --sender-id 5")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = {
        name: opts.name,
        templateId: Number(opts.templateId),
        senderId: Number(opts.senderId),
      };
      if (opts.scheduledAt) body.scheduledAt = opts.scheduledAt;
      if (opts.recipients) body.recipients = JSON.parse(opts.recipients);
      const data = await client.post("/whatsappCampaigns", body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

whatsappCampaignsResource
  .command("send")
  .description("Send a WhatsApp campaign immediately")
  .argument("<id>", "Campaign ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.post(`/whatsappCampaigns/${id}/sendNow`, {});
      output({ sent: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

whatsappCampaignsResource
  .command("delete")
  .description("Delete a WhatsApp campaign")
  .argument("<id>", "Campaign ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/whatsappCampaigns/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

whatsappCampaignsResource
  .command("templates")
  .description("List WhatsApp templates")
  .option("--start-date <date>", "Start date (YYYY-MM-DD)")
  .option("--end-date <date>", "End date (YYYY-MM-DD)")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset", "0")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const params: Record<string, unknown> = { limit: opts.limit, offset: opts.offset };
      if (opts.startDate) params.startDate = opts.startDate;
      if (opts.endDate) params.endDate = opts.endDate;
      const data = await client.get("/whatsappCampaigns/template-list", params);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

whatsappCampaignsResource
  .command("stats")
  .description("Get WhatsApp campaign statistics")
  .argument("<id>", "Campaign ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/whatsappCampaigns/${id}/statistics`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
