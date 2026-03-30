import { Command } from "commander";
import { client } from "../lib/client.js";
import { printTable, printRecord, output, success } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const ticketsCommand = new Command("ticket").description("Manage tickets");

ticketsCommand
  .command("list")
  .description("List tickets")
  .option("--page <n>", "Page number", "1")
  .option("--per-page <n>", "Results per page", "25")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.get("/tickets", { page: opts.page, per_page: opts.perPage, expand: "true" }) as unknown[];
      const rows = (Array.isArray(data) ? data : Object.values(data as object)) as Record<string, unknown>[];
      if (opts.json) { output(rows, { json: true }); return; }
      printTable(
        rows.map(t => ({
          id: t.id,
          title: String(t.title ?? "").slice(0, 55),
          state: t.state ?? t.state_id,
          priority: t.priority ?? t.priority_id,
          group: t.group ?? t.group_id,
          customer: t.customer ?? t.customer_id,
          created_at: String(t.created_at ?? "").slice(0, 10),
        })),
        ["id", "title", "state", "priority", "group", "customer", "created_at"],
        `Tickets (page ${opts.page})`
      );
    } catch (err) { handleError(err, opts.json); }
  });

ticketsCommand
  .command("get <id>")
  .description("Get a ticket by ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const t = await client.get(`/tickets/${id}`, { expand: "true" }) as Record<string, unknown>;
      if (opts.json) { output(t, { json: true }); return; }
      printRecord(t, ["id","number","title","state","priority","group","customer","owner","organization","created_at","updated_at","close_at","note"], `Ticket #${id}`);
    } catch (err) { handleError(err, opts.json); }
  });

ticketsCommand
  .command("search <query>")
  .description("Search tickets")
  .option("--page <n>", "Page", "1")
  .option("--per-page <n>", "Results per page", "25")
  .option("--json", "Output as JSON")
  .action(async (query, opts) => {
    try {
      const result = await client.get("/tickets/search", { query, page: opts.page, per_page: opts.perPage, expand: "true" });
      const rows = Array.isArray(result)
        ? result as Record<string, unknown>[]
        : Object.values((result as Record<string, unknown>)?.assets?.Ticket ?? result as object) as Record<string, unknown>[];
      if (opts.json) { output(rows, { json: true }); return; }
      printTable(
        rows.map(t => ({ id: t.id, title: String(t.title ?? "").slice(0, 55), state: t.state ?? t.state_id, created_at: String(t.created_at ?? "").slice(0, 10) })),
        ["id", "title", "state", "created_at"],
        `Search: "${query}"`
      );
    } catch (err) { handleError(err, opts.json); }
  });

ticketsCommand
  .command("create")
  .description("Create a ticket")
  .requiredOption("--title <s>", "Title")
  .requiredOption("--group <s>", "Group name or ID")
  .requiredOption("--customer <s>", "Customer email or ID")
  .option("--body <s>", "Article body")
  .option("--state <s>", "State", "new")
  .option("--priority <s>", "Priority", "2 normal")
  .option("--type <s>", "Article type", "note")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const t = await client.post("/tickets", {
        title: opts.title,
        group: opts.group,
        customer: opts.customer,
        state: opts.state,
        priority: opts.priority,
        article: { subject: opts.title, body: opts.body || opts.title, type: opts.type, internal: false },
      }) as Record<string, unknown>;
      if (opts.json) { output(t, { json: true }); return; }
      success(`Ticket #${t.id} created: ${t.title}`);
    } catch (err) { handleError(err, opts.json); }
  });

ticketsCommand
  .command("update <id>")
  .description("Update a ticket")
  .option("--title <s>")
  .option("--state <s>")
  .option("--priority <s>")
  .option("--group <s>")
  .option("--owner <s>")
  .option("--note <s>", "Add an internal note")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data: Record<string, unknown> = {};
      for (const k of ["title", "state", "priority", "group", "owner"]) if (opts[k]) data[k] = opts[k];
      if (opts.note) data.article = { subject: "Note", body: opts.note, type: "note", internal: true };
      const t = await client.put(`/tickets/${id}`, data) as Record<string, unknown>;
      if (opts.json) { output(t, { json: true }); return; }
      success(`Ticket #${t.id} updated.`);
    } catch (err) { handleError(err, opts.json); }
  });

ticketsCommand
  .command("close <id>")
  .description("Close a ticket")
  .option("--note <s>", "Closing note")
  .action(async (id, opts) => {
    try {
      const data: Record<string, unknown> = { state: "closed" };
      if (opts.note) data.article = { subject: "Closed", body: opts.note, type: "note", internal: true };
      const t = await client.put(`/tickets/${id}`, data) as Record<string, unknown>;
      success(`Ticket #${t.id} closed.`);
    } catch (err) { handleError(err); }
  });

ticketsCommand
  .command("delete <id>")
  .description("Delete a ticket")
  .option("--yes", "Skip confirmation")
  .action(async (id, opts) => {
    try {
      if (!opts.yes) {
        process.stdout.write(`Delete ticket #${id}? [y/N] `);
        const answer = await new Promise<string>(r => process.stdin.once("data", d => r(d.toString().trim())));
        if (!["y", "yes"].includes(answer.toLowerCase())) { console.log("Aborted."); return; }
      }
      await client.delete(`/tickets/${id}`);
      success(`Ticket #${id} deleted.`);
    } catch (err) { handleError(err); }
  });

ticketsCommand
  .command("articles <id>")
  .description("List articles of a ticket")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const articles = await client.get(`/ticket_articles/by_ticket/${id}`) as Record<string, unknown>[];
      if (opts.json) { output(articles, { json: true }); return; }
      printTable(
        (articles || []).map(a => ({
          id: a.id,
          type: a.type ?? a.type_id,
          from: String(a.from ?? "").slice(0, 30),
          subject: String(a.subject ?? "").slice(0, 50),
          internal: a.internal,
          created_at: String(a.created_at ?? "").slice(0, 16),
        })),
        ["id", "type", "from", "subject", "internal", "created_at"],
        `Articles — ticket #${id}`
      );
    } catch (err) { handleError(err, opts.json); }
  });

ticketsCommand
  .command("reply <id>")
  .description("Add an article/reply to a ticket")
  .requiredOption("--body <s>", "Article body")
  .option("--subject <s>", "Subject", "Reply")
  .option("--type <s>", "Article type (note, email, phone...)", "note")
  .option("--internal", "Mark as internal")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const a = await client.post("/ticket_articles", {
        ticket_id: Number(id),
        subject: opts.subject,
        body: opts.body,
        type: opts.type,
        internal: opts.internal ?? false,
      }) as Record<string, unknown>;
      if (opts.json) { output(a, { json: true }); return; }
      success(`Article #${a.id} added to ticket #${id}.`);
    } catch (err) { handleError(err, opts.json); }
  });
