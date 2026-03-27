import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const contactsResource = new Command("contacts")
  .description("Manage Brevo contacts");

// LIST
contactsResource
  .command("list")
  .description("List all contacts")
  .option("--limit <n>", "Max results (default 50, max 1000)", "50")
  .option("--offset <n>", "Offset for pagination", "0")
  .option("--sort <order>", "Sort order: asc or desc", "desc")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExamples:\n  brevo-cli contacts list\n  brevo-cli contacts list --limit 10 --json")
  .action(async (opts) => {
    try {
      const data = await client.get("/contacts", {
        limit: opts.limit,
        offset: opts.offset,
        sort: opts.sort,
      });
      output(data, { json: opts.json, format: opts.format, fields: opts.fields?.split(",") });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// GET
contactsResource
  .command("get")
  .description("Get a contact by email or ID")
  .argument("<identifier>", "Contact email or ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExamples:\n  brevo-cli contacts get john@example.com\n  brevo-cli contacts get 42")
  .action(async (identifier, opts) => {
    try {
      const data = await client.get(`/contacts/${identifier}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// CREATE
contactsResource
  .command("create")
  .description("Create a new contact")
  .requiredOption("--email <email>", "Contact email address")
  .option("--firstname <name>", "First name")
  .option("--lastname <name>", "Last name")
  .option("--list-ids <ids>", "Comma-separated list IDs to add the contact to")
  .option("--json", "Output as JSON")
  .addHelpText("after", '\nExamples:\n  brevo-cli contacts create --email john@example.com --firstname John --lastname Doe\n  brevo-cli contacts create --email john@example.com --list-ids 1,2')
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = { email: opts.email };
      const attrs: Record<string, string> = {};
      if (opts.firstname) attrs.FIRSTNAME = opts.firstname;
      if (opts.lastname) attrs.LASTNAME = opts.lastname;
      if (Object.keys(attrs).length) body.attributes = attrs;
      if (opts.listIds) body.listIds = opts.listIds.split(",").map(Number);
      const data = await client.post("/contacts", body);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// UPDATE
contactsResource
  .command("update")
  .description("Update a contact by email or ID")
  .argument("<identifier>", "Contact email or ID")
  .option("--firstname <name>", "New first name")
  .option("--lastname <name>", "New last name")
  .option("--json", "Output as JSON")
  .addHelpText("after", '\nExamples:\n  brevo-cli contacts update john@example.com --firstname Johnny')
  .action(async (identifier, opts) => {
    try {
      const attrs: Record<string, string> = {};
      if (opts.firstname) attrs.FIRSTNAME = opts.firstname;
      if (opts.lastname) attrs.LASTNAME = opts.lastname;
      await client.put(`/contacts/${identifier}`, { attributes: attrs });
      output({ updated: true, identifier }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// DELETE
contactsResource
  .command("delete")
  .description("Delete a contact by email or ID")
  .argument("<identifier>", "Contact email or ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli contacts delete john@example.com")
  .action(async (identifier, opts) => {
    try {
      await client.delete(`/contacts/${identifier}`);
      output({ deleted: true, identifier }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
