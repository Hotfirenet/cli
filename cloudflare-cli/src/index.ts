#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { profileCommand } from "./commands/profile.js";
import { zonesResource } from "./resources/zones.js";
import { dnsResource } from "./resources/dns.js";
import { ipListsResource } from "./resources/ip-lists.js";
import { analyticsResource } from "./resources/analytics.js";

const program = new Command();

program
  .name("cloudflare-cli")
  .description("CLI for the cloudflare API")
  .version("0.1.0")
  .option("--json", "Output as JSON", false)
  .option("--profile <name>", "Use a specific profile (overrides default)")
  .option("--verbose", "Enable verbose logging", false)
  .hook("preAction", (_cmd, action) => {
    const o = action.optsWithGlobals();
    globalFlags.json    = o.json    ?? false;
    globalFlags.verbose = o.verbose ?? false;
    globalFlags.profile = o.profile ?? null;
  });

program.addCommand(profileCommand);
program.addCommand(authCommand);
program.addCommand(zonesResource);
program.addCommand(dnsResource);
program.addCommand(ipListsResource);
program.addCommand(analyticsResource);

program.parse();
