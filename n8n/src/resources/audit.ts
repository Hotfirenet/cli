import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const auditResource = new Command("audit")
  .description("Generate n8n security audit report");

auditResource
  .command("run")
  .description("Generate a security audit of your n8n instance")
  .option("--no-credentials", "Exclude credentials from audit")
  .option("--no-database", "Exclude database from audit")
  .option("--no-filesystem", "Exclude filesystem from audit")
  .option("--no-nodes", "Exclude nodes from audit")
  .option("--no-instance", "Exclude instance settings from audit")
  .option("--days <n>", "Days of inactivity to consider a workflow abandoned", "90")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const categories: string[] = [];
      if (opts.credentials !== false) categories.push("credentials");
      if (opts.database !== false) categories.push("database");
      if (opts.filesystem !== false) categories.push("filesystem");
      if (opts.nodes !== false) categories.push("nodes");
      if (opts.instance !== false) categories.push("instance");

      const body: Record<string, unknown> = {
        additionalOptions: {
          daysAbandonedWorkflow: Number(opts.days),
          categories,
        },
      };
      const data = await client.post("/audit", body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
