import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";
import { readFileSync } from "fs";

export const credentialsResource = new Command("credentials")
  .description("Manage n8n credentials");

credentialsResource
  .command("list")
  .description("List all credentials")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const data = await client.get("/credentials");
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

credentialsResource
  .command("get <id>")
  .description("Get credential schema by ID (values are masked)")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/credentials/${id}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

credentialsResource
  .command("create")
  .description("Create a credential from a JSON file or inline")
  .option("--file <file>", "JSON file with credential definition")
  .option("--name <name>", "Credential name")
  .option("--type <type>", "Credential type (e.g. httpBasicAuth, oAuth2Api)")
  .option("--data <json>", "Credential data as JSON string")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  n8n-cli credentials create --name \"My API\" --type httpHeaderAuth --data '{\"name\":\"Authorization\",\"value\":\"Bearer xxx\"}'")
  .action(async (opts) => {
    try {
      let body: Record<string, unknown>;
      if (opts.file) {
        body = JSON.parse(readFileSync(opts.file, "utf-8"));
      } else {
        if (!opts.name || !opts.type) {
          console.error("Error: --name and --type required (or use --file)");
          process.exit(1);
        }
        body = {
          name: opts.name,
          type: opts.type,
          data: opts.data ? JSON.parse(opts.data) : {},
        };
      }
      const data = await client.post("/credentials", body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

credentialsResource
  .command("delete <id>")
  .description("Delete a credential")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(`/credentials/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

credentialsResource
  .command("schema <type>")
  .description("Get the schema for a credential type")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  n8n-cli credentials schema httpBasicAuth")
  .action(async (type, opts) => {
    try {
      const data = await client.get(`/credentials/schema/${type}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

credentialsResource
  .command("transfer <id>")
  .description("Transfer a credential to another project")
  .argument("<destination-project-id>", "Target project ID")
  .option("--json", "Output as JSON")
  .action(async (id, destinationProjectId, opts) => {
    try {
      const data = await client.put(`/credentials/${id}/transfer`, { destinationProjectId });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
