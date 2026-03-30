import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

// Cloudflare Account Filter Lists (used for IP banning via SmallGuard)
// Endpoint: /accounts/{account_id}/rules/lists

export const ipListsResource = new Command("ip-lists")
  .description("Manage Cloudflare IP lists (account-level filter lists)");

ipListsResource
  .command("list <account-id>")
  .description("List all IP lists for an account")
  .option("--json", "Output as JSON")
  .action(async (accountId, opts) => {
    try {
      const data = await client.get(`/accounts/${accountId}/rules/lists`) as { result: unknown[] };
      output(data.result, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

ipListsResource
  .command("get <account-id> <list-id>")
  .description("Get details of an IP list")
  .option("--json", "Output as JSON")
  .action(async (accountId, listId, opts) => {
    try {
      const data = await client.get(`/accounts/${accountId}/rules/lists/${listId}`) as { result: unknown };
      output(data.result, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

ipListsResource
  .command("items <account-id> <list-id>")
  .description("List all items in an IP list")
  .option("--json", "Output as JSON")
  .action(async (accountId, listId, opts) => {
    try {
      const data = await client.get(`/accounts/${accountId}/rules/lists/${listId}/items`) as { result: unknown[] };
      output(data.result, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

ipListsResource
  .command("add <account-id> <list-id>")
  .description("Add IPs to a list")
  .requiredOption("--ip <ips...>", "IP address(es) to add (space-separated)")
  .option("--comment <comment>", "Optional comment")
  .option("--json", "Output as JSON")
  .action(async (accountId, listId, opts) => {
    try {
      const items = opts.ip.map((ip: string) => ({
        ip,
        comment: opts.comment ?? "",
      }));
      const data = await client.post(`/accounts/${accountId}/rules/lists/${listId}/items`, items);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

ipListsResource
  .command("remove <account-id> <list-id>")
  .description("Remove IPs from a list by item ID")
  .requiredOption("--id <ids...>", "Item ID(s) to remove (space-separated)")
  .option("--json", "Output as JSON")
  .action(async (accountId, listId, opts) => {
    try {
      const items = opts.id.map((id: string) => ({ id }));
      const data = await client.delete_with_body(`/accounts/${accountId}/rules/lists/${listId}/items`, { items });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

ipListsResource
  .command("create <account-id>")
  .description("Create a new IP list")
  .requiredOption("--name <name>", "List name (alphanumeric and underscores only)")
  .option("--description <desc>", "List description")
  .option("--json", "Output as JSON")
  .action(async (accountId, opts) => {
    try {
      const data = await client.post(`/accounts/${accountId}/rules/lists`, {
        name: opts.name,
        description: opts.description ?? "",
        kind: "ip",
      }) as { result: unknown };
      output(data.result, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
