#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { statesResource } from "./resources/states.js";
import { servicesResource } from "./resources/services.js";
import { eventsResource } from "./resources/events.js";
import { historyResource } from "./resources/history.js";
import { templateResource } from "./resources/template.js";
import { configResource } from "./resources/config.js";
import { instancesResource } from "./resources/instances.js";

const program = new Command();

program
  .name("ha-cli")
  .description("CLI for Home Assistant REST API")
  .version("0.1.0")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json", "text")
  .option("--verbose", "Enable verbose logging", false)
  .option("--instance <name>", "Use a specific instance (overrides active)")
  .hook("preAction", (_cmd, action) => {
    const o = action.optsWithGlobals();
    globalFlags.json = o.json ?? false;
    globalFlags.format = o.format ?? "text";
    globalFlags.verbose = o.verbose ?? false;
    globalFlags.instance = o.instance ?? "";
  });

program.addCommand(instancesResource);
program.addCommand(authCommand);
program.addCommand(statesResource);
program.addCommand(servicesResource);
program.addCommand(eventsResource);
program.addCommand(historyResource);
program.addCommand(templateResource);
program.addCommand(configResource);

program.parse();
