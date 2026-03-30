import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const analyticsResource = new Command("analytics")
  .description("Cloudflare zone analytics");

analyticsResource
  .command("dashboard <zone-id>")
  .description("Zone analytics dashboard (requests, bandwidth, threats, pageviews)")
  .option("--since <datetime>", "Start time ISO8601 or relative (-1440 = last 24h)", "-10080")
  .option("--until <datetime>", "End time ISO8601 (default: now)")
  .option("--continuous", "Continuous flag", false)
  .option("--json", "Output as JSON")
  .action(async (zoneId, opts) => {
    try {
      const params: Record<string, unknown> = { since: opts.since };
      if (opts.until) params.until = opts.until;
      if (opts.continuous) params.continuous = true;
      const data = await client.get(`/zones/${zoneId}/analytics/dashboard`, params) as { result: unknown };
      output(data.result, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

analyticsResource
  .command("threats <zone-id>")
  .description("Top threat sources (IPs, countries) for a zone")
  .option("--since <datetime>", "Start time ISO8601 or relative minutes", "-10080")
  .option("--json", "Output as JSON")
  .action(async (zoneId, opts) => {
    try {
      const data = await client.get(`/zones/${zoneId}/analytics/dashboard`, {
        since: opts.since,
      }) as { result: { threats?: unknown; totals?: unknown } };
      const result = data.result;
      output(
        {
          totals: (result as Record<string, unknown>).totals,
          threats: (result as Record<string, unknown>).threats,
        },
        { json: opts.json }
      );
    } catch (err) { handleError(err, opts.json); }
  });

analyticsResource
  .command("firewall <zone-id>")
  .description("Firewall events for a zone")
  .option("--since <datetime>", "Start time ISO8601", "-10080")
  .option("--limit <n>", "Max results", "100")
  .option("--json", "Output as JSON")
  .action(async (zoneId, opts) => {
    try {
      const data = await client.get(`/zones/${zoneId}/firewall/events`, {
        since: opts.since,
        per_page: opts.limit,
      }) as { result: unknown[] };
      output(data.result, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
