import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const sendersResource = new Command("senders")
  .description("Manage email senders and domains");

// SENDERS
sendersResource
  .command("list")
  .description("List all senders")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (opts) => {
    try {
      const data = await client.get("/senders");
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

sendersResource
  .command("create")
  .description("Create a new sender")
  .requiredOption("--email <email>", "Sender email")
  .requiredOption("--name <name>", "Sender name")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.post("/senders", { email: opts.email, name: opts.name });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

sendersResource
  .command("update")
  .description("Update a sender")
  .argument("<id>", "Sender ID")
  .option("--name <name>", "New sender name")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      await client.put(`/senders/${id}`, body);
      output({ updated: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

sendersResource
  .command("delete")
  .description("Delete a sender")
  .argument("<id>", "Sender ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/senders/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

// DOMAINS
sendersResource
  .command("domains-list")
  .description("List all domains")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.get("/domains");
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

sendersResource
  .command("domains-add")
  .description("Add a domain")
  .requiredOption("--name <domain>", "Domain name (e.g. mail.example.com)")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.post("/domains", { name: opts.name });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

sendersResource
  .command("domains-delete")
  .description("Delete a domain")
  .argument("<domain>", "Domain name")
  .option("--json", "Output as JSON")
  .action(async (domain, opts) => {
    try {
      await client.delete(`/domains/${domain}`);
      output({ deleted: true, domain }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

sendersResource
  .command("domains-authenticate")
  .description("Authenticate a domain")
  .argument("<domain>", "Domain name")
  .option("--json", "Output as JSON")
  .action(async (domain, opts) => {
    try {
      const data = await client.post(`/domains/${domain}/authenticate`, {});
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
