import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const listsResource = new Command("lists")
  .description("Manage contact lists");

// LIST
listsResource
  .command("list")
  .description("List all contact lists")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset", "0")
  .option("--sort <order>", "Sort order: asc or desc", "desc")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  brevo-cli lists list --json")
  .action(async (opts) => {
    try {
      const data = await client.get("/contacts/lists", {
        limit: opts.limit,
        offset: opts.offset,
        sort: opts.sort,
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// GET
listsResource
  .command("get")
  .description("Get a contact list by ID")
  .argument("<id>", "List ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli lists get 3")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/contacts/lists/${id}`);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// GET CONTACTS IN LIST
listsResource
  .command("contacts")
  .description("List contacts in a specific list")
  .argument("<id>", "List ID")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset", "0")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli lists contacts 3 --json")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/contacts/lists/${id}/contacts`, {
        limit: opts.limit,
        offset: opts.offset,
      });
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// CREATE
listsResource
  .command("create")
  .description("Create a new contact list")
  .requiredOption("--name <name>", "List name")
  .requiredOption("--folder-id <id>", "Folder ID to place the list in")
  .option("--json", "Output as JSON")
  .addHelpText("after", '\nExample:\n  brevo-cli lists create --name "Newsletter FR" --folder-id 1')
  .action(async (opts) => {
    try {
      const data = await client.post("/contacts/lists", {
        name: opts.name,
        folderId: Number(opts.folderId),
      });
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// DELETE
listsResource
  .command("delete")
  .description("Delete a contact list by ID")
  .argument("<id>", "List ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli lists delete 3")
  .action(async (id, opts) => {
    try {
      await client.delete(`/contacts/lists/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
