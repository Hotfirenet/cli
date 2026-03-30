import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const eventsResource = new Command("events").description("List and fire events");

eventsResource
  .command("list")
  .description("List all available event types")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.get("/events");
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

eventsResource
  .command("fire <event_type>")
  .description("Fire an event")
  .option("--data <json>", "Event data as JSON")
  .option("--json", "Output as JSON")
  .action(async (eventType, opts) => {
    try {
      const body = opts.data ? JSON.parse(opts.data) : {};
      const data = await client.post(`/events/${eventType}`, body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
