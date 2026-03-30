import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const configResource = new Command("config").description("HA configuration and system info");

configResource
  .command("get")
  .description("Get Home Assistant configuration")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.get("/config");
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

configResource
  .command("error-log")
  .description("Get the error log")
  .action(async () => {
    try {
      const data = await client.get("/error_log") as string;
      console.log(data);
    } catch (err) { handleError(err); }
  });

configResource
  .command("check")
  .description("Trigger a config check")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.post("/config/core/check_config", {});
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
