import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const crmCompaniesResource = new Command("crm-companies")
  .description("Manage CRM companies");

crmCompaniesResource
  .command("list")
  .description("List all CRM companies")
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
      const data = await client.get("/crm/companies", params);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

crmCompaniesResource
  .command("get")
  .description("Get a CRM company by ID")
  .argument("<id>", "Company ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/crm/companies/${id}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

crmCompaniesResource
  .command("create")
  .description("Create a CRM company")
  .requiredOption("--name <name>", "Company name")
  .option("--attributes <json>", "Company attributes as JSON string")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli crm-companies create --name \"Acme Corp\" --attributes '{\"industry\":\"Tech\"}'")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = { name: opts.name };
      if (opts.attributes) body.attributes = JSON.parse(opts.attributes);
      const data = await client.post("/crm/companies", body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

crmCompaniesResource
  .command("update")
  .description("Update a CRM company")
  .argument("<id>", "Company ID")
  .option("--name <name>", "New name")
  .option("--attributes <json>", "Attributes as JSON string")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      if (opts.attributes) body.attributes = JSON.parse(opts.attributes);
      await client.patch(`/crm/companies/${id}`, body);
      output({ updated: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

crmCompaniesResource
  .command("delete")
  .description("Delete a CRM company")
  .argument("<id>", "Company ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/crm/companies/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
