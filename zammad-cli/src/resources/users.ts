import { Command } from "commander";
import { client } from "../lib/client.js";
import { printTable, printRecord, output, success } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const usersCommand = new Command("user").description("Manage users");

usersCommand
  .command("list")
  .description("List users")
  .option("--page <n>", "Page", "1")
  .option("--per-page <n>", "Results per page", "25")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const users = await client.get("/users", { page: opts.page, per_page: opts.perPage }) as Record<string, unknown>[];
      if (opts.json) { output(users, { json: true }); return; }
      printTable(
        (users || []).map(u => ({ id: u.id, login: u.login, firstname: u.firstname, lastname: u.lastname, email: u.email, active: u.active })),
        ["id", "login", "firstname", "lastname", "email", "active"],
        `Users (page ${opts.page})`
      );
    } catch (err) { handleError(err, opts.json); }
  });

usersCommand
  .command("me")
  .description("Show current authenticated user")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const u = await client.get("/users/me") as Record<string, unknown>;
      if (opts.json) { output(u, { json: true }); return; }
      printRecord(u, ["id","login","firstname","lastname","email","organization","active","last_login"], "Current User");
    } catch (err) { handleError(err, opts.json); }
  });

usersCommand
  .command("get <id>")
  .description("Get a user by ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const u = await client.get(`/users/${id}`) as Record<string, unknown>;
      if (opts.json) { output(u, { json: true }); return; }
      printRecord(u, ["id","login","firstname","lastname","email","phone","mobile","organization","note","active","last_login","created_at"], `User #${id}`);
    } catch (err) { handleError(err, opts.json); }
  });

usersCommand
  .command("search <query>")
  .description("Search users")
  .option("--page <n>", "Page", "1")
  .option("--per-page <n>", "Results per page", "25")
  .option("--json", "Output as JSON")
  .action(async (query, opts) => {
    try {
      const users = await client.get("/users/search", { query, page: opts.page, per_page: opts.perPage }) as Record<string, unknown>[];
      if (opts.json) { output(users, { json: true }); return; }
      printTable(
        (users || []).map(u => ({ id: u.id, login: u.login, firstname: u.firstname, lastname: u.lastname, email: u.email })),
        ["id", "login", "firstname", "lastname", "email"],
        `Users: "${query}"`
      );
    } catch (err) { handleError(err, opts.json); }
  });

usersCommand
  .command("create")
  .description("Create a user")
  .requiredOption("--email <s>", "Email")
  .requiredOption("--firstname <s>", "First name")
  .requiredOption("--lastname <s>", "Last name")
  .option("--login <s>", "Login (defaults to email)")
  .option("--password <s>", "Password")
  .option("--phone <s>")
  .option("--mobile <s>")
  .option("--organization <s>")
  .option("--note <s>")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data: Record<string, unknown> = { email: opts.email, firstname: opts.firstname, lastname: opts.lastname, login: opts.login || opts.email };
      for (const k of ["password","phone","mobile","organization","note"]) if (opts[k]) data[k] = opts[k];
      const u = await client.post("/users", data) as Record<string, unknown>;
      if (opts.json) { output(u, { json: true }); return; }
      success(`User #${u.id} created: ${u.email}`);
    } catch (err) { handleError(err, opts.json); }
  });

usersCommand
  .command("update <id>")
  .description("Update a user")
  .option("--firstname <s>")
  .option("--lastname <s>")
  .option("--email <s>")
  .option("--phone <s>")
  .option("--mobile <s>")
  .option("--note <s>")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data: Record<string, unknown> = {};
      for (const k of ["firstname","lastname","email","phone","mobile","note"]) if (opts[k]) data[k] = opts[k];
      const u = await client.put(`/users/${id}`, data) as Record<string, unknown>;
      if (opts.json) { output(u, { json: true }); return; }
      success(`User #${u.id} updated.`);
    } catch (err) { handleError(err, opts.json); }
  });

usersCommand
  .command("delete <id>")
  .description("Delete a user")
  .option("--yes", "Skip confirmation")
  .action(async (id, opts) => {
    try {
      if (!opts.yes) {
        process.stdout.write(`Delete user #${id}? [y/N] `);
        const answer = await new Promise<string>(r => process.stdin.once("data", d => r(d.toString().trim())));
        if (!["y", "yes"].includes(answer.toLowerCase())) { console.log("Aborted."); return; }
      }
      await client.delete(`/users/${id}`);
      success(`User #${id} deleted.`);
    } catch (err) { handleError(err); }
  });
