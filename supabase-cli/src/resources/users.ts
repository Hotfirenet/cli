import { Command } from "commander";
import { client } from "../lib/client.js";
import { output, handleError } from "../lib/output.js";

export const usersResource = new Command("users")
  .description("Manage Supabase Auth users (requires service_role key)")
  .addHelpText("after", `
Examples:
  supabase-cli users list
  supabase-cli users get abc-123
  supabase-cli users create --email user@example.com --password secret123
  supabase-cli users update abc-123 --data '{"email_confirmed_at":"2024-01-01T00:00:00Z"}'
  supabase-cli users delete abc-123
`);

usersResource
  .command("list")
  .description("List all users")
  .option("--page <n>", "Page number", "1")
  .option("--per-page <n>", "Users per page", "50")
  .action(async (opts) => {
    try {
      const data = await client.get("/auth/v1/admin/users", {
        page: opts.page,
        per_page: opts.perPage,
      });
      output((data as Record<string, unknown>).users ?? data, { label: "users" });
    } catch (e) { handleError(e); }
  });

usersResource
  .command("get <id>")
  .description("Get a user by ID")
  .action(async (id) => {
    try {
      const data = await client.get(`/auth/v1/admin/users/${id}`);
      output(data, { label: "user" });
    } catch (e) { handleError(e); }
  });

usersResource
  .command("create")
  .description("Create a new user")
  .requiredOption("--email <email>", "User email")
  .option("--password <pwd>", "User password")
  .option("--phone <phone>", "User phone number")
  .option("--role <role>", "User role")
  .option("--confirm", "Mark email as confirmed immediately")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = { email: opts.email };
      if (opts.password) body.password = opts.password;
      if (opts.phone) body.phone = opts.phone;
      if (opts.role) body.role = opts.role;
      if (opts.confirm) body.email_confirm = true;
      const data = await client.post("/auth/v1/admin/users", body);
      output(data, { label: "user" });
    } catch (e) { handleError(e); }
  });

usersResource
  .command("update <id>")
  .description("Update a user")
  .requiredOption("--data <json>", "Fields to update as JSON object")
  .action(async (id, opts) => {
    try {
      const body = JSON.parse(opts.data);
      const data = await client.patch(`/auth/v1/admin/users/${id}`, body);
      output(data, { label: "user" });
    } catch (e) { handleError(e); }
  });

usersResource
  .command("delete <id>")
  .description("Delete a user")
  .action(async (id) => {
    try {
      await client.delete(`/auth/v1/admin/users/${id}`);
      console.log(`User ${id} deleted.`);
    } catch (e) { handleError(e); }
  });
