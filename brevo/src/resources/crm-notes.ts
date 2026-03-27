import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const crmNotesResource = new Command("crm-notes")
  .description("Manage CRM notes");

crmNotesResource
  .command("list")
  .description("List all CRM notes")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset", "0")
  .option("--sort <field>", "Sort field")
  .option("--sort-order <order>", "Sort order: asc or desc", "desc")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const params: Record<string, unknown> = { limit: opts.limit, offset: opts.offset };
      if (opts.sort) params.sort = opts.sort;
      if (opts.sortOrder) params.sortOrder = opts.sortOrder;
      const data = await client.get("/crm/notes", params);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

crmNotesResource
  .command("get")
  .description("Get a CRM note by ID")
  .argument("<id>", "Note ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/crm/notes/${id}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

crmNotesResource
  .command("create")
  .description("Create a CRM note")
  .requiredOption("--text <text>", "Note text")
  .option("--contact-id <id>", "Link to contact ID")
  .option("--deal-id <id>", "Link to deal ID")
  .option("--company-id <id>", "Link to company ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli crm-notes create --text \"Discussed pricing\" --deal-id abc123")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = { text: opts.text };
      if (opts.contactId) body.contactsIds = [Number(opts.contactId)];
      if (opts.dealId) body.dealsIds = [opts.dealId];
      if (opts.companyId) body.companiesIds = [opts.companyId];
      const data = await client.post("/crm/notes", body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

crmNotesResource
  .command("update")
  .description("Update a CRM note")
  .argument("<id>", "Note ID")
  .requiredOption("--text <text>", "New note text")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.patch(`/crm/notes/${id}`, { text: opts.text });
      output({ updated: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

crmNotesResource
  .command("delete")
  .description("Delete a CRM note")
  .argument("<id>", "Note ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/crm/notes/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
