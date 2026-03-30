import { Command } from "commander";
import { client } from "../lib/client.js";
import { printTable, printRecord, output, success } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const orgsCommand = new Command("org").description("Manage organizations");

orgsCommand
  .command("list")
  .description("List organizations")
  .option("--page <n>", "Page", "1")
  .option("--per-page <n>", "Results per page", "25")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const orgs = await client.get("/organizations", { page: opts.page, per_page: opts.perPage }) as Record<string, unknown>[];
      if (opts.json) { output(orgs, { json: true }); return; }
      printTable(
        (orgs || []).map(o => ({ id: o.id, name: o.name, domain: o.domain, active: o.active, note: String(o.note ?? "").slice(0, 50) })),
        ["id", "name", "domain", "active", "note"],
        `Organizations (page ${opts.page})`
      );
    } catch (err) { handleError(err, opts.json); }
  });

orgsCommand
  .command("get <id>")
  .description("Get an organization by ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const o = await client.get(`/organizations/${id}`) as Record<string, unknown>;
      if (opts.json) { output(o, { json: true }); return; }
      printRecord(o, ["id","name","domain","active","note","created_at","updated_at"], `Organization #${id}`);
    } catch (err) { handleError(err, opts.json); }
  });

orgsCommand
  .command("search <query>")
  .description("Search organizations")
  .option("--page <n>", "Page", "1")
  .option("--per-page <n>", "Results per page", "25")
  .option("--json", "Output as JSON")
  .action(async (query, opts) => {
    try {
      const orgs = await client.get("/organizations/search", { query, page: opts.page, per_page: opts.perPage }) as Record<string, unknown>[];
      if (opts.json) { output(orgs, { json: true }); return; }
      printTable(
        (orgs || []).map(o => ({ id: o.id, name: o.name, domain: o.domain })),
        ["id", "name", "domain"],
        `Organizations: "${query}"`
      );
    } catch (err) { handleError(err, opts.json); }
  });

orgsCommand
  .command("create")
  .description("Create an organization")
  .requiredOption("--name <s>", "Organization name")
  .option("--domain <s>")
  .option("--note <s>")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data: Record<string, unknown> = { name: opts.name };
      if (opts.domain) data.domain = opts.domain;
      if (opts.note) data.note = opts.note;
      const o = await client.post("/organizations", data) as Record<string, unknown>;
      if (opts.json) { output(o, { json: true }); return; }
      success(`Organization #${o.id} created: ${o.name}`);
    } catch (err) { handleError(err, opts.json); }
  });

orgsCommand
  .command("update <id>")
  .description("Update an organization")
  .option("--name <s>")
  .option("--domain <s>")
  .option("--note <s>")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data: Record<string, unknown> = {};
      for (const k of ["name","domain","note"]) if (opts[k]) data[k] = opts[k];
      const o = await client.put(`/organizations/${id}`, data) as Record<string, unknown>;
      if (opts.json) { output(o, { json: true }); return; }
      success(`Organization #${o.id} updated.`);
    } catch (err) { handleError(err, opts.json); }
  });

orgsCommand
  .command("delete <id>")
  .description("Delete an organization")
  .option("--yes", "Skip confirmation")
  .action(async (id, opts) => {
    try {
      if (!opts.yes) {
        process.stdout.write(`Delete organization #${id}? [y/N] `);
        const answer = await new Promise<string>(r => process.stdin.once("data", d => r(d.toString().trim())));
        if (!["y", "yes"].includes(answer.toLowerCase())) { console.log("Aborted."); return; }
      }
      await client.delete(`/organizations/${id}`);
      success(`Organization #${id} deleted.`);
    } catch (err) { handleError(err); }
  });
