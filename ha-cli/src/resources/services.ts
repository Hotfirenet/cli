import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const servicesResource = new Command("services").description("List and call services");

servicesResource
  .command("list")
  .description("List all available services")
  .option("--domain <domain>", "Filter by domain (e.g. light, switch)")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.get("/services") as Array<{ domain: string; services: Record<string, unknown> }>;
      const filtered = opts.domain ? data.filter(d => d.domain === opts.domain) : data;
      output(filtered, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

servicesResource
  .command("call <domain> <service>")
  .description("Call a service (e.g. ha services call light turn_on)")
  .option("--entity <entity_id>", "Target entity ID")
  .option("--data <json>", "Additional service data as JSON")
  .option("--json", "Output as JSON")
  .action(async (domain, service, opts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.entity) body.entity_id = opts.entity;
      if (opts.data) Object.assign(body, JSON.parse(opts.data));
      const data = await client.post(`/services/${domain}/${service}`, body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
