import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const templatesResource = new Command("templates")
  .description("Manage email templates");

templatesResource
  .command("list")
  .description("List all email templates")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset", "0")
  .option("--sort <order>", "Sort: asc or desc", "desc")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (opts) => {
    try {
      const data = await client.get("/smtp/templates", { limit: opts.limit, offset: opts.offset, sort: opts.sort });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

templatesResource
  .command("get")
  .description("Get a template by ID")
  .argument("<id>", "Template ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/smtp/templates/${id}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

templatesResource
  .command("create")
  .description("Create an email template")
  .requiredOption("--name <name>", "Template name")
  .requiredOption("--subject <subject>", "Email subject")
  .requiredOption("--sender-email <email>", "Sender email")
  .option("--sender-name <name>", "Sender name")
  .option("--html <html>", "HTML content")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.post("/smtp/templates", {
        templateName: opts.name,
        subject: opts.subject,
        sender: { email: opts.senderEmail, ...(opts.senderName && { name: opts.senderName }) },
        ...(opts.html && { htmlContent: opts.html }),
      });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

templatesResource
  .command("update")
  .description("Update an email template")
  .argument("<id>", "Template ID")
  .option("--name <name>", "New name")
  .option("--subject <subject>", "New subject")
  .option("--html <html>", "New HTML content")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name) body.templateName = opts.name;
      if (opts.subject) body.subject = opts.subject;
      if (opts.html) body.htmlContent = opts.html;
      await client.put(`/smtp/templates/${id}`, body);
      output({ updated: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

templatesResource
  .command("delete")
  .description("Delete an email template")
  .argument("<id>", "Template ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/smtp/templates/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

templatesResource
  .command("send-test")
  .description("Send a test email for a template")
  .argument("<id>", "Template ID")
  .requiredOption("--email <email>", "Recipient email for test")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.post(`/smtp/templates/${id}/send-test`, { emailTo: [opts.email] });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
