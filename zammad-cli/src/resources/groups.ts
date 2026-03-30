import { Command } from "commander";
import { client } from "../lib/client.js";
import { printTable, printRecord, output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const groupsCommand = new Command("group").description("List groups");

groupsCommand
  .command("list")
  .description("List all groups")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const groups = await client.get("/groups", { per_page: "100" }) as Record<string, unknown>[];
      if (opts.json) { output(groups, { json: true }); return; }
      printTable(
        (groups || []).map(g => ({ id: g.id, name: g.name, active: g.active, note: String(g.note ?? "").slice(0, 60) })),
        ["id", "name", "active", "note"],
        "Groups"
      );
    } catch (err) { handleError(err, opts.json); }
  });

groupsCommand
  .command("get <id>")
  .description("Get a group by ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const g = await client.get(`/groups/${id}`) as Record<string, unknown>;
      if (opts.json) { output(g, { json: true }); return; }
      printRecord(g, undefined, `Group #${id}`);
    } catch (err) { handleError(err, opts.json); }
  });
