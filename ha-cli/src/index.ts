#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { profileCommand } from "./commands/profile.js";
import { statesResource } from "./resources/states.js";
import { servicesResource } from "./resources/services.js";
import { eventsResource } from "./resources/events.js";
import { historyResource } from "./resources/history.js";
import { templateResource } from "./resources/template.js";
import { configResource } from "./resources/config.js";
import { instancesResource } from "./resources/instances.js";
import { wsResource } from "./resources/ws.js";

const program = new Command();

program
  .name("ha-cli")
  .description("CLI for Home Assistant REST + WebSocket API")
  .version("0.2.0")
  .option("--profile <name>", "Use a specific instance/profile")
  .option("--instance <name>", "Alias for --profile")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json", "text")
  .option("--verbose", "Enable verbose logging", false)
  .hook("preAction", (_cmd, action) => {
    const o = action.optsWithGlobals();
    globalFlags.json    = o.json    ?? false;
    globalFlags.format  = o.format  ?? "text";
    globalFlags.verbose = o.verbose ?? false;
    // --instance is an alias for --profile (HA-specific naming)
    globalFlags.profile = o.profile ?? o.instance ?? null;
  });

program.addCommand(instancesResource);
program.addCommand(profileCommand);
program.addCommand(authCommand);
program.addCommand(statesResource);
program.addCommand(servicesResource);
program.addCommand(eventsResource);
program.addCommand(historyResource);
program.addCommand(templateResource);
program.addCommand(configResource);
program.addCommand(wsResource);

program.parse();
