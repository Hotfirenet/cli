#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { generateCommand } from "./resources/generate.js";
import { editCommand } from "./resources/edit.js";

const program = new Command();

program
  .name("nanobanana-cli")
  .description("CLI for the nanobanana API")
  .version("0.1.0")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json, csv, yaml", "text")
  .option("--verbose", "Enable verbose logging", false)
  .hook("preAction", (_cmd, action) => {
    const o = action.optsWithGlobals();
    globalFlags.json = o.json ?? false;
    globalFlags.format = o.format ?? "text";
    globalFlags.verbose = o.verbose ?? false;
  });

program.addCommand(authCommand);
program.addCommand(generateCommand);
program.addCommand(editCommand);

program.parse();
