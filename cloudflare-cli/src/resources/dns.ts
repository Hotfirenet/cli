import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const dnsResource = new Command("dns")
  .description("Manage DNS records");

dnsResource
  .command("list <zone-id>")
  .description("List DNS records for a zone")
  .option("--type <type>", "Record type (A, AAAA, CNAME, MX, TXT, etc.)")
  .option("--name <name>", "Filter by record name")
  .option("--json", "Output as JSON")
  .action(async (zoneId, opts) => {
    try {
      const data = await client.get(`/zones/${zoneId}/dns_records`, {
        type: opts.type,
        name: opts.name,
        per_page: 100,
      }) as { result: unknown[] };
      output(data.result, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

dnsResource
  .command("get <zone-id> <record-id>")
  .description("Get a DNS record")
  .option("--json", "Output as JSON")
  .action(async (zoneId, recordId, opts) => {
    try {
      const data = await client.get(`/zones/${zoneId}/dns_records/${recordId}`) as { result: unknown };
      output(data.result, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

dnsResource
  .command("create <zone-id>")
  .description("Create a DNS record")
  .requiredOption("--type <type>", "Record type (A, AAAA, CNAME, MX, TXT, etc.)")
  .requiredOption("--name <name>", "Record name")
  .requiredOption("--content <content>", "Record content (IP, target, etc.)")
  .option("--ttl <ttl>", "TTL in seconds (1 = auto)", "1")
  .option("--proxied", "Enable Cloudflare proxy", false)
  .option("--priority <n>", "Priority (MX/SRV only)")
  .option("--json", "Output as JSON")
  .action(async (zoneId, opts) => {
    try {
      const body: Record<string, unknown> = {
        type: opts.type,
        name: opts.name,
        content: opts.content,
        ttl: parseInt(opts.ttl),
        proxied: opts.proxied,
      };
      if (opts.priority) body.priority = parseInt(opts.priority);
      const data = await client.post(`/zones/${zoneId}/dns_records`, body) as { result: unknown };
      output(data.result, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

dnsResource
  .command("update <zone-id> <record-id>")
  .description("Update a DNS record")
  .option("--content <content>", "New content")
  .option("--ttl <ttl>", "TTL in seconds")
  .option("--proxied <bool>", "Enable/disable proxy (true/false)")
  .option("--json", "Output as JSON")
  .action(async (zoneId, recordId, opts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.content) body.content = opts.content;
      if (opts.ttl) body.ttl = parseInt(opts.ttl);
      if (opts.proxied !== undefined) body.proxied = opts.proxied === "true";
      const data = await client.patch(`/zones/${zoneId}/dns_records/${recordId}`, body) as { result: unknown };
      output(data.result, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

dnsResource
  .command("delete <zone-id> <record-id>")
  .description("Delete a DNS record")
  .option("--json", "Output as JSON")
  .action(async (zoneId, recordId, opts) => {
    try {
      const data = await client.delete(`/zones/${zoneId}/dns_records/${recordId}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
