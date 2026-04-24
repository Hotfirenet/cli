import { Command } from "commander";
import { client } from "../lib/client.js";
import { output, handleError } from "../lib/output.js";

export const rpcResource = new Command("rpc")
  .description("Call a Supabase database RPC function")
  .argument("<function>", "Name of the function to call")
  .option("--data <json>", "Function arguments as JSON object", "{}")
  .addHelpText("after", `
Examples:
  supabase-cli rpc get_user_stats --data '{"user_id":"abc-123"}'
  supabase-cli rpc increment_counter --data '{"table":"views","id":1}'
  supabase-cli rpc hello_world
`)
  .action(async (fn, opts) => {
    try {
      const body = JSON.parse(opts.data);
      const data = await client.post(`/rest/v1/rpc/${fn}`, body);
      output(data, { label: fn });
    } catch (e) { handleError(e); }
  });
