import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const attributesResource = new Command("attributes")
  .description("Manage contact attributes");

attributesResource
  .command("list")
  .description("List all contact attributes")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const data = await client.get("/contacts/attributes");
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

attributesResource
  .command("create")
  .description("Create a contact attribute")
  .argument("<category>", "Category: normal, transactional, category, calculated, global")
  .argument("<name>", "Attribute name (uppercase, e.g. PHONE)")
  .option("--type <type>", "Type: text, date, float, boolean, id, category", "text")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli attributes create normal PHONE --type text")
  .action(async (category, name, opts) => {
    try {
      const data = await client.post(`/contacts/attributes/${category}/${name}`, { type: opts.type });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

attributesResource
  .command("delete")
  .description("Delete a contact attribute")
  .argument("<category>", "Category: normal, transactional, category, calculated, global")
  .argument("<name>", "Attribute name")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli attributes delete normal PHONE")
  .action(async (category, name, opts) => {
    try {
      await client.delete(`/contacts/attributes/${category}/${name}`);
      output({ deleted: true, category, name }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
