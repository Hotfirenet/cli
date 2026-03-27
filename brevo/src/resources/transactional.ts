import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const transactionalResource = new Command("transactional")
  .description("Send transactional emails and SMS");

// SEND EMAIL
transactionalResource
  .command("send-email")
  .description("Send a transactional email")
  .requiredOption("--to <email>", "Recipient email address")
  .option("--to-name <name>", "Recipient name")
  .requiredOption("--subject <subject>", "Email subject")
  .option("--html <html>", "HTML body content")
  .option("--text <text>", "Plain text body content")
  .option("--template-id <id>", "Brevo template ID to use")
  .option("--from-email <email>", "Sender email (uses account default if not set)")
  .option("--from-name <name>", "Sender name")
  .option("--reply-to <email>", "Reply-to email address")
  .option("--json", "Output as JSON")
  .addHelpText("after", '\nExamples:\n  brevo-cli transactional send-email --to user@example.com --subject "Hello" --html "<p>Hi!</p>"\n  brevo-cli transactional send-email --to user@example.com --subject "Welcome" --template-id 5')
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = {
        to: [{ email: opts.to, ...(opts.toName && { name: opts.toName }) }],
        subject: opts.subject,
      };
      if (opts.fromEmail) body.sender = { email: opts.fromEmail, ...(opts.fromName && { name: opts.fromName }) };
      if (opts.html) body.htmlContent = opts.html;
      if (opts.text) body.textContent = opts.text;
      if (opts.templateId) body.templateId = Number(opts.templateId);
      if (opts.replyTo) body.replyTo = { email: opts.replyTo };
      const data = await client.post("/smtp/email", body);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// SEND SMS
transactionalResource
  .command("send-sms")
  .description("Send a transactional SMS")
  .requiredOption("--to <phone>", "Recipient phone number (international format, e.g. +33600000000)")
  .requiredOption("--content <text>", "SMS content")
  .requiredOption("--sender <name>", "Sender name (max 11 chars)")
  .option("--json", "Output as JSON")
  .addHelpText("after", '\nExample:\n  brevo-cli transactional send-sms --to +33600000000 --content "Your code: 1234" --sender MyApp')
  .action(async (opts) => {
    try {
      const data = await client.post("/transactionalSMS/sms", {
        recipient: opts.to,
        content: opts.content,
        sender: opts.sender,
      });
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// LIST SENT
transactionalResource
  .command("list-sent")
  .description("List sent transactional emails")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset", "0")
  .option("--email <email>", "Filter by recipient email")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExamples:\n  brevo-cli transactional list-sent\n  brevo-cli transactional list-sent --email user@example.com --json")
  .action(async (opts) => {
    try {
      const data = await client.get("/smtp/emails", {
        limit: opts.limit,
        offset: opts.offset,
        ...(opts.email && { email: opts.email }),
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
