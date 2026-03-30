import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const usersResource = new Command("users")
  .description("Manage n8n users");

usersResource
  .command("list")
  .description("List all users")
  .option("--limit <n>", "Max results", "100")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const params: Record<string, unknown> = { limit: opts.limit };
      if (opts.cursor) params.cursor = opts.cursor;
      const data = await client.get("/users", params);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

usersResource
  .command("get <id>")
  .description("Get a user by ID or email")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/users/${id}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

usersResource
  .command("me")
  .description("Get current authenticated user info")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.get("/me");
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

usersResource
  .command("delete <id>")
  .description("Delete a user")
  .option("--transfer-to <id>", "Transfer workflows/credentials to this user ID before deletion")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const params: Record<string, unknown> = {};
      if (opts.transferTo) params.transferId = opts.transferTo;
      await client.delete(`/users/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

usersResource
  .command("change-role <id>")
  .description("Change a user's global role")
  .argument("<role>", "Role: global:admin or global:member")
  .option("--json", "Output as JSON")
  .action(async (id, role, opts) => {
    try {
      const data = await client.patch(`/users/${id}/role`, { newRoleName: role });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
