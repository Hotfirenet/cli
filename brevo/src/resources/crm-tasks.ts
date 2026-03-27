import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const crmTasksResource = new Command("crm-tasks")
  .description("Manage CRM tasks");

crmTasksResource
  .command("list")
  .description("List all CRM tasks")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset", "0")
  .option("--sort <field>", "Sort field")
  .option("--sort-order <order>", "Sort order: asc or desc", "desc")
  .option("--filter-type <type>", "Filter by task type ID")
  .option("--filter-status <bool>", "Filter by completion status: true or false")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const params: Record<string, unknown> = { limit: opts.limit, offset: opts.offset };
      if (opts.sort) params.sort = opts.sort;
      if (opts.sortOrder) params.sortOrder = opts.sortOrder;
      if (opts.filterType) params["filter[type]"] = opts.filterType;
      if (opts.filterStatus) params["filter[status]"] = opts.filterStatus;
      const data = await client.get("/crm/tasks", params);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

crmTasksResource
  .command("get")
  .description("Get a CRM task by ID")
  .argument("<id>", "Task ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/crm/tasks/${id}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

crmTasksResource
  .command("create")
  .description("Create a CRM task")
  .requiredOption("--name <name>", "Task name")
  .requiredOption("--type <type>", "Task type ID")
  .option("--due-date <date>", "Due date (ISO 8601)")
  .option("--done", "Mark as done")
  .option("--assigned-to <id>", "Assign to user ID")
  .option("--contact-id <id>", "Link to contact ID")
  .option("--deal-id <id>", "Link to deal ID")
  .option("--company-id <id>", "Link to company ID")
  .option("--notes <notes>", "Task notes")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = { name: opts.name, taskTypeId: opts.type };
      if (opts.dueDate) body.date = opts.dueDate;
      if (opts.done) body.done = true;
      if (opts.assignedTo) body.assignToId = opts.assignedTo;
      if (opts.contactId) body.contactsIds = [Number(opts.contactId)];
      if (opts.dealId) body.dealsIds = [opts.dealId];
      if (opts.companyId) body.companiesIds = [opts.companyId];
      if (opts.notes) body.notes = opts.notes;
      const data = await client.post("/crm/tasks", body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

crmTasksResource
  .command("update")
  .description("Update a CRM task")
  .argument("<id>", "Task ID")
  .option("--name <name>", "New name")
  .option("--due-date <date>", "Due date (ISO 8601)")
  .option("--done <bool>", "Completion status: true or false")
  .option("--notes <notes>", "Task notes")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      if (opts.dueDate) body.date = opts.dueDate;
      if (opts.done !== undefined) body.done = opts.done === "true";
      if (opts.notes) body.notes = opts.notes;
      await client.patch(`/crm/tasks/${id}`, body);
      output({ updated: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

crmTasksResource
  .command("delete")
  .description("Delete a CRM task")
  .argument("<id>", "Task ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/crm/tasks/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

crmTasksResource
  .command("types")
  .description("List all CRM task types")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.get("/crm/tasktypes");
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
