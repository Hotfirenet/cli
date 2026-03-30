/**
 * Home Assistant WebSocket API client.
 * Spec: https://developers.home-assistant.io/docs/api/websocket
 */
import { getToken, getBaseUrl } from "./config.js";
import { CliError } from "./errors.js";

let _msgId = 1;
function nextId() { return _msgId++; }

/** Derive ws(s):// URL from the configured HTTP base URL */
function wsUrl(): string {
  const base = getBaseUrl(); // e.g. http://192.168.1.10:8123/api
  return base
    .replace(/^http:\/\//, "ws://")
    .replace(/^https:\/\//, "wss://")
    .replace(/\/api$/, "/api/websocket");
}

export interface HaWsMessage {
  id?: number;
  type: string;
  [key: string]: unknown;
}

/** Open an authenticated HA WebSocket connection. Returns the socket ready to use. */
export async function connect(): Promise<WebSocket> {
  const token = getToken();
  if (!token) throw new CliError(401, "No token configured. Run: ha-cli instances add");

  const url = wsUrl();
  const ws = new WebSocket(url);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close();
      reject(new CliError(408, `WebSocket connection timed out: ${url}`));
    }, 10_000);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as HaWsMessage;

      if (msg.type === "auth_required") {
        ws.send(JSON.stringify({ type: "auth", access_token: token }));
        return;
      }
      if (msg.type === "auth_ok") {
        clearTimeout(timeout);
        ws.onmessage = null;
        resolve();
        return;
      }
      if (msg.type === "auth_invalid") {
        clearTimeout(timeout);
        ws.close();
        reject(new CliError(401, "Authentication failed — check your token."));
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new CliError(503, `Cannot connect to ${url}`));
    };
  });

  return ws;
}

/** Send a command and wait for its result message. */
export async function sendCommand(ws: WebSocket, payload: Record<string, unknown>): Promise<unknown> {
  const id = nextId();
  const msg = { id, ...payload };

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new CliError(408, "Command timed out")), 15_000);

    const prev = ws.onmessage;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as HaWsMessage;
      if (data.id !== id) { prev?.(event); return; }
      clearTimeout(timeout);
      ws.onmessage = prev;
      if (data.type === "result") {
        if (data.success) resolve(data.result);
        else reject(new CliError(400, String((data.error as Record<string,unknown>)?.message ?? data.error)));
      }
    };

    ws.send(JSON.stringify(msg));
  });
}

/** Subscribe to events and call handler for each. Returns an unsubscribe function. */
export function subscribe(
  ws: WebSocket,
  eventType: string | null,
  handler: (event: unknown) => void,
): () => void {
  const id = nextId();
  const payload: Record<string, unknown> = { id, type: "subscribe_events" };
  if (eventType) payload.event_type = eventType;
  ws.send(JSON.stringify(payload));

  const prev = ws.onmessage;
  ws.onmessage = (raw) => {
    const msg = JSON.parse(raw.data) as HaWsMessage;
    if (msg.type === "event" && msg.id === id) {
      handler(msg.event);
    } else {
      prev?.(raw);
    }
  };

  return () => {
    ws.send(JSON.stringify({ id: nextId(), type: "unsubscribe_events", subscription: id }));
  };
}
