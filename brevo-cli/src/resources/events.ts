import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const eventsResource = new Command("events")
  .description("Track and manage contact events");

eventsResource
  .command("track")
  .description("Track a custom event for a contact")
  .requiredOption("--email <email>", "Contact email")
  .requiredOption("--event <name>", "Event name")
  .option("--properties <json>", "Event properties as JSON string")
  .option("--event-date <date>", "Event date (ISO 8601)")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli events track --email user@example.com --event page_viewed --properties '{\"page\":\"/pricing\"}'")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = {
        email: opts.email,
        event: opts.event,
      };
      if (opts.properties) body.properties = JSON.parse(opts.properties);
      if (opts.eventDate) body.eventdate = opts.eventDate;
      const data = await client.post("/trackEvent", body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

eventsResource
  .command("identify")
  .description("Identify a contact (track page view)")
  .requiredOption("--email <email>", "Contact email")
  .option("--page <url>", "Page URL")
  .option("--properties <json>", "Contact properties as JSON string")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = {
        email: opts.email,
        ...(opts.page && { url: opts.page }),
        ...(opts.properties && { properties: JSON.parse(opts.properties) }),
      };
      const data = await client.post("/contacts/identify", body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

eventsResource
  .command("list-types")
  .description("List all custom event types")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const data = await client.get("/events");
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });
