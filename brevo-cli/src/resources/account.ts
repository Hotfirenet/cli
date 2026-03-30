import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const accountResource = new Command("account")
  .description("Manage account information and settings");

accountResource
  .command("info")
  .description("Get account information")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.get("/account");
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

accountResource
  .command("plan")
  .description("Get current plan and usage")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.get("/account");
      // Extract plan info
      const planInfo = (data as Record<string, unknown>).plan;
      output(planInfo, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

// API keys
accountResource
  .command("api-keys")
  .description("List all API keys")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const data = await client.get("/account/apikey");
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

accountResource
  .command("api-key-create")
  .description("Create an API key")
  .requiredOption("--name <name>", "API key name")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.post("/account/apikey", { name: opts.name });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

accountResource
  .command("api-key-delete")
  .description("Delete an API key")
  .argument("<key>", "API key")
  .option("--json", "Output as JSON")
  .action(async (key, opts) => {
    try {
      await client.delete(`/account/apikey/${key}`);
      output({ deleted: true, key }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

// Users
accountResource
  .command("users")
  .description("List all account users")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const data = await client.get("/organization/user/invitation/getAll");
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

accountResource
  .command("invite-user")
  .description("Invite a user to the account")
  .requiredOption("--email <email>", "User email")
  .requiredOption("--role <role>", "Role: OWNER, USER, MANAGER, VIEWER")
  .option("--all-features", "Grant access to all features")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = {
        email: opts.email,
        role: opts.role,
        feature_access: opts.allFeatures ? "all" : undefined,
      };
      const data = await client.post("/organization/user/invitation/send", body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

accountResource
  .command("revoke-user")
  .description("Revoke a user invitation")
  .argument("<email>", "User email")
  .option("--json", "Output as JSON")
  .action(async (email, opts) => {
    try {
      await client.put(`/organization/user/invitation/revoke/${encodeURIComponent(email)}`, {});
      output({ revoked: true, email }, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
