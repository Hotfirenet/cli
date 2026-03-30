import { Command } from "commander";
import { client } from "../lib/client.js";
import { printTable, output, success } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const tagsCommand = new Command("tag").description("Manage tags on tickets");

tagsCommand
  .command("list <ticket_id>")
  .description("List tags on a ticket")
  .option("--json", "Output as JSON")
  .action(async (ticketId, opts) => {
    try {
      const result = await client.get("/tags", { object: "Ticket", o_id: ticketId }) as Record<string, unknown>;
      const tags = (result?.tags as string[]) ?? [];
      if (opts.json) { output(tags, { json: true }); return; }
      if (!tags.length) { console.log(`No tags on ticket #${ticketId}.`); return; }
      printTable(tags.map(t => ({ tag: t })), ["tag"], `Tags — ticket #${ticketId}`);
    } catch (err) { handleError(err, opts.json); }
  });

tagsCommand
  .command("add <ticket_id> <tag>")
  .description("Add a tag to a ticket")
  .action(async (ticketId, tag) => {
    try {
      await client.post("/tags/add", { object: "Ticket", o_id: Number(ticketId), item: tag });
      success(`Tag '${tag}' added to ticket #${ticketId}.`);
    } catch (err) { handleError(err); }
  });

tagsCommand
  .command("remove <ticket_id> <tag>")
  .description("Remove a tag from a ticket")
  .action(async (ticketId, tag) => {
    try {
      await client.delete(`/tags/remove?object=Ticket&o_id=${ticketId}&item=${encodeURIComponent(tag)}`);
      success(`Tag '${tag}' removed from ticket #${ticketId}.`);
    } catch (err) { handleError(err); }
  });
