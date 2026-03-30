import { Command } from "commander";
import { connect, sendCommand, subscribe } from "../lib/ws.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const wsResource = new Command("ws").description("Home Assistant WebSocket API");

// ─── ping ─────────────────────────────────────────────────────────────────────

wsResource
  .command("ping")
  .description("Test WebSocket connection and authentication")
  .action(async () => {
    try {
      const ws = await connect();
      const result = await sendCommand(ws, { type: "ping" });
      ws.close();
      console.log(`✓ WebSocket OK — pong: ${JSON.stringify(result)}`);
    } catch (err) { handleError(err); }
  });

// ─── states ───────────────────────────────────────────────────────────────────

wsResource
  .command("states")
  .description("Get all entity states via WebSocket")
  .option("--filter <pattern>", "Filter by entity_id glob (e.g. light.*)")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const ws = await connect();
      const states = await sendCommand(ws, { type: "get_states" }) as Record<string, unknown>[];
      ws.close();

      let rows = states;
      if (opts.filter) {
        const regex = new RegExp("^" + opts.filter.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
        rows = states.filter(s => regex.test(String(s.entity_id)));
      }

      if (opts.json) { output(rows, { json: true }); return; }

      for (const s of rows) {
        const attrs = s.attributes as Record<string, unknown>;
        const friendly = attrs?.friendly_name ?? "";
        console.log(`  ${String(s.entity_id).padEnd(45)} ${String(s.state).padEnd(12)} ${friendly}`);
      }
      console.log(`\n${rows.length} entities`);
    } catch (err) { handleError(err, opts.json); }
  });

// ─── call ─────────────────────────────────────────────────────────────────────

wsResource
  .command("call <domain> <service>")
  .description("Call a service via WebSocket")
  .option("--target <entity>", "Target entity_id (comma-separated)")
  .option("--data <json>", "Service data as JSON string")
  .option("--json", "Output as JSON")
  .action(async (domain, service, opts) => {
    try {
      const ws = await connect();
      const payload: Record<string, unknown> = { type: "call_service", domain, service };

      if (opts.target) {
        payload.target = { entity_id: opts.target.includes(",") ? opts.target.split(",") : opts.target };
      }
      if (opts.data) {
        try { payload.service_data = JSON.parse(opts.data); }
        catch { handleError(new Error(`Invalid JSON in --data: ${opts.data}`)); }
      }

      const result = await sendCommand(ws, payload);
      ws.close();

      if (opts.json) { output(result, { json: true }); return; }
      console.log(`✓ ${domain}.${service} called.`);
      if (result) console.log(JSON.stringify(result, null, 2));
    } catch (err) { handleError(err, opts.json); }
  });

// ─── listen ───────────────────────────────────────────────────────────────────

wsResource
  .command("listen [event_type]")
  .description("Stream events in real time (Ctrl+C to stop)")
  .option("--filter <pattern>", "Filter entity_id (for state_changed events)")
  .option("--json", "Output each event as JSON")
  .action(async (eventType, opts) => {
    try {
      const ws = await connect();
      const type = eventType ?? null;
      console.log(`Listening for ${type ?? "all"} events… (Ctrl+C to stop)\n`);

      subscribe(ws, type, (event) => {
        const ev = event as Record<string, unknown>;

        // Filter state_changed by entity_id pattern if requested
        if (opts.filter && ev.event_type === "state_changed") {
          const entityId = (ev.data as Record<string, unknown>)?.entity_id as string;
          const regex = new RegExp("^" + opts.filter.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
          if (!regex.test(entityId)) return;
        }

        if (opts.json) { console.log(JSON.stringify(ev)); return; }

        const ts = new Date().toISOString().slice(11, 19);
        const evType = String(ev.event_type ?? "event");

        if (evType === "state_changed") {
          const data = ev.data as Record<string, unknown>;
          const ns = data?.new_state as Record<string, unknown>;
          const os = data?.old_state as Record<string, unknown>;
          console.log(`[${ts}] state_changed  ${data?.entity_id}  ${os?.state ?? "?"} → ${ns?.state ?? "?"}`);
        } else {
          console.log(`[${ts}] ${evType}  ${JSON.stringify(ev.data ?? {}).slice(0, 100)}`);
        }
      });

      // Keep alive until Ctrl+C
      await new Promise<void>((_, reject) => {
        process.on("SIGINT", () => { ws.close(); reject(new Error("interrupted")); });
        ws.onclose = () => reject(new Error("Connection closed"));
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg !== "interrupted") handleError(err);
    }
  });

// ─── fire ────────────────────────────────────────────────────────────────────

wsResource
  .command("fire <event_type>")
  .description("Fire a custom event")
  .option("--data <json>", "Event data as JSON string")
  .action(async (eventType, opts) => {
    try {
      const ws = await connect();
      const payload: Record<string, unknown> = { type: "fire_event", event_type: eventType };
      if (opts.data) {
        try { payload.event_data = JSON.parse(opts.data); }
        catch { handleError(new Error(`Invalid JSON in --data: ${opts.data}`)); }
      }
      await sendCommand(ws, payload);
      ws.close();
      console.log(`✓ Event "${eventType}" fired.`);
    } catch (err) { handleError(err); }
  });

// ─── template ─────────────────────────────────────────────────────────────────

wsResource
  .command("template <tpl>")
  .description("Render a Jinja2 template via WebSocket")
  .action(async (tpl) => {
    try {
      const ws = await connect();
      const result = await sendCommand(ws, { type: "render_template", template: tpl });
      ws.close();
      console.log(result);
    } catch (err) { handleError(err); }
  });
