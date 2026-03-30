import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const zonesResource = new Command("zones")
  .description("Manage Cloudflare zones (domains)");

zonesResource
  .command("list")
  .description("List all zones")
  .option("--name <name>", "Filter by domain name")
  .option("--status <status>", "Filter by status (active, pending, paused)")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.get("/zones", {
        name: opts.name,
        status: opts.status,
        per_page: 50,
      }) as { result: unknown[] };
      output(data.result, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

zonesResource
  .command("get <zone-id>")
  .description("Get zone details")
  .option("--json", "Output as JSON")
  .action(async (zoneId, opts) => {
    try {
      const data = await client.get(`/zones/${zoneId}`) as { result: unknown };
      output(data.result, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

zonesResource
  .command("purge-cache <zone-id>")
  .description("Purge all cache for a zone")
  .option("--json", "Output as JSON")
  .action(async (zoneId, opts) => {
    try {
      const data = await client.post(`/zones/${zoneId}/purge_cache`, { purge_everything: true });
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
