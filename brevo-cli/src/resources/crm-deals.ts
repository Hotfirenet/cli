import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const crmDealsResource = new Command("crm-deals")
  .description("Manage CRM deals");

crmDealsResource
  .command("list")
  .description("List all CRM deals")
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
      const data = await client.get("/crm/deals", params);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

crmDealsResource
  .command("get")
  .description("Get a CRM deal by ID")
  .argument("<id>", "Deal ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/crm/deals/${id}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

crmDealsResource
  .command("create")
  .description("Create a CRM deal")
  .requiredOption("--name <name>", "Deal name")
  .option("--attributes <json>", "Deal attributes as JSON string")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli crm-deals create --name \"Big Deal\" --attributes '{\"amount\":5000}'")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = { name: opts.name };
      if (opts.attributes) body.attributes = JSON.parse(opts.attributes);
      const data = await client.post("/crm/deals", body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

crmDealsResource
  .command("update")
  .description("Update a CRM deal")
  .argument("<id>", "Deal ID")
  .option("--name <name>", "New name")
  .option("--attributes <json>", "Attributes as JSON string")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      if (opts.attributes) body.attributes = JSON.parse(opts.attributes);
      await client.patch(`/crm/deals/${id}`, body);
      output({ updated: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

crmDealsResource
  .command("delete")
  .description("Delete a CRM deal")
  .argument("<id>", "Deal ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/crm/deals/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

crmDealsResource
  .command("link-contact")
  .description("Link a contact to a deal")
  .argument("<deal-id>", "Deal ID")
  .argument("<contact-id>", "Contact ID")
  .option("--json", "Output as JSON")
  .action(async (dealId, contactId, opts) => {
    try {
      await client.patch(`/crm/deals/link-unlink/${dealId}`, { linkContactIds: [Number(contactId)] });
      output({ linked: true, dealId, contactId }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

crmDealsResource
  .command("link-company")
  .description("Link a company to a deal")
  .argument("<deal-id>", "Deal ID")
  .argument("<company-id>", "Company ID")
  .option("--json", "Output as JSON")
  .action(async (dealId, companyId, opts) => {
    try {
      await client.patch(`/crm/deals/link-unlink/${dealId}`, { linkCompanyIds: [companyId] });
      output({ linked: true, dealId, companyId }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
