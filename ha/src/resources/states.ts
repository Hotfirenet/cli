import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const statesResource = new Command("states").description("Manage entity states");

statesResource
  .command("list")
  .description("List all entity states")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.get("/states");
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

statesResource
  .command("get <entity_id>")
  .description("Get state of an entity (e.g. light.living_room)")
  .option("--json", "Output as JSON")
  .action(async (entityId, opts) => {
    try {
      const data = await client.get(`/states/${entityId}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

statesResource
  .command("set <entity_id> <state>")
  .description("Set state of an entity")
  .option("--attributes <json>", "JSON attributes object")
  .option("--json", "Output as JSON")
  .action(async (entityId, state, opts) => {
    try {
      const body: Record<string, unknown> = { state };
      if (opts.attributes) body.attributes = JSON.parse(opts.attributes);
      const data = await client.post(`/states/${entityId}`, body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

statesResource
  .command("filter <domain>")
  .description("List states for a domain (e.g. light, switch, sensor)")
  .option("--json", "Output as JSON")
  .action(async (domain, opts) => {
    try {
      const data = await client.get("/states") as Array<{ entity_id: string; state: string; attributes: Record<string, unknown> }>;
      const filtered = data.filter(e => e.entity_id.startsWith(`${domain}.`));
      output(filtered, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
