import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const foldersResource = new Command("folders")
  .description("Manage contact folders");

foldersResource
  .command("list")
  .description("List all folders")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset", "0")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const data = await client.get("/contacts/folders", { limit: opts.limit, offset: opts.offset });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

foldersResource
  .command("get")
  .description("Get a folder by ID")
  .argument("<id>", "Folder ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/contacts/folders/${id}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

foldersResource
  .command("lists")
  .description("Get all lists in a folder")
  .argument("<id>", "Folder ID")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset", "0")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/contacts/folders/${id}/lists`, { limit: opts.limit, offset: opts.offset });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

foldersResource
  .command("create")
  .description("Create a folder")
  .requiredOption("--name <name>", "Folder name")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.post("/contacts/folders", { name: opts.name });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

foldersResource
  .command("update")
  .description("Update a folder")
  .argument("<id>", "Folder ID")
  .requiredOption("--name <name>", "New folder name")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.put(`/contacts/folders/${id}`, { name: opts.name });
      output({ updated: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

foldersResource
  .command("delete")
  .description("Delete a folder and all its lists")
  .argument("<id>", "Folder ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/contacts/folders/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
