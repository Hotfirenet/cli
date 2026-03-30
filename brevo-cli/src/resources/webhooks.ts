import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const webhooksResource = new Command("webhooks")
  .description("Manage webhooks");

webhooksResource
  .command("list")
  .description("List all webhooks")
  .option("--type <type>", "Filter by type: transactional or marketing")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (opts) => {
    try {
      const data = await client.get("/webhooks", { ...(opts.type && { type: opts.type }) });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

webhooksResource
  .command("get")
  .description("Get a webhook by ID")
  .argument("<id>", "Webhook ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/webhooks/${id}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

webhooksResource
  .command("create")
  .description("Create a webhook")
  .requiredOption("--url <url>", "Webhook URL")
  .requiredOption("--events <events>", "Comma-separated events (e.g. delivered,opened,clicked)")
  .option("--type <type>", "Webhook type: transactional or marketing", "transactional")
  .option("--description <desc>", "Description")
  .option("--json", "Output as JSON")
  .addHelpText("after", '\nExample:\n  brevo-cli webhooks create --url https://example.com/hook --events "delivered,opened,clicked"')
  .action(async (opts) => {
    try {
      const data = await client.post("/webhooks", {
        url: opts.url,
        events: opts.events.split(","),
        type: opts.type,
        ...(opts.description && { description: opts.description }),
      });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

webhooksResource
  .command("update")
  .description("Update a webhook")
  .argument("<id>", "Webhook ID")
  .option("--url <url>", "New URL")
  .option("--events <events>", "New events (comma-separated)")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.url) body.url = opts.url;
      if (opts.events) body.events = opts.events.split(",");
      await client.put(`/webhooks/${id}`, body);
      output({ updated: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

webhooksResource
  .command("delete")
  .description("Delete a webhook")
  .argument("<id>", "Webhook ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/webhooks/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
