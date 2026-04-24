#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { profileCommand } from "./commands/profile.js";
import { tableResource } from "./resources/table.js";
import { usersResource } from "./resources/users.js";
import { storageResource } from "./resources/storage.js";
import { rpcResource } from "./resources/rpc.js";
import { emailResource } from "./resources/email.js";

const program = new Command();

program
  .name("supabase-cli")
  .description("CLI for Supabase — table CRUD, auth users, storage, and RPC via the REST API")
  .version("0.1.0")
  .option("--profile <name>", "Use a specific profile (overrides default)")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json, csv, yaml", "text")
  .option("--verbose", "Enable debug logging", false)
  .option("--no-color", "Disable colored output")
  .option("--no-header", "Omit table/csv headers")
  .hook("preAction", (_thisCmd, actionCmd) => {
    const root = actionCmd.optsWithGlobals();
    globalFlags.json = root.json ?? false;
    globalFlags.format = root.format ?? "text";
    globalFlags.verbose = root.verbose ?? false;
    globalFlags.noColor = root.color === false;
    globalFlags.noHeader = root.header === false;
    globalFlags.profile = root.profile ?? null;
  });

program.addCommand(authCommand);
program.addCommand(profileCommand);
program.addCommand(tableResource);
program.addCommand(usersResource);
program.addCommand(storageResource);
program.addCommand(rpcResource);
program.addCommand(emailResource);

program.parse();
