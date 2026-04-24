#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { profileCommand } from "./commands/profile.js";
import { workflowsResource } from "./resources/workflows.js";
import { executionsResource } from "./resources/executions.js";
import { credentialsResource } from "./resources/credentials.js";
import { tagsResource } from "./resources/tags.js";
import { variablesResource } from "./resources/variables.js";
import { usersResource } from "./resources/users.js";
import { projectsResource } from "./resources/projects.js";
import { auditResource } from "./resources/audit.js";

const program = new Command();

program
  .name("n8n-cli")
  .description("CLI for n8n — manage workflows, executions, credentials and more")
  .version("0.1.0")
  .option("--profile <name>", "Use a specific profile (overrides default)")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json, csv, yaml", "text")
  .option("--verbose", "Enable verbose logging", false)
  .hook("preAction", (_cmd, action) => {
    const o = action.optsWithGlobals();
    globalFlags.json = o.json ?? false;
    globalFlags.profile = (action ?? _cmd).optsWithGlobals().profile ?? null;
    globalFlags.format = o.format ?? "text";
    globalFlags.verbose = o.verbose ?? false;
  });

program.addCommand(profileCommand);
program.addCommand(authCommand);
program.addCommand(workflowsResource);
program.addCommand(executionsResource);
program.addCommand(credentialsResource);
program.addCommand(tagsResource);
program.addCommand(variablesResource);
program.addCommand(usersResource);
program.addCommand(projectsResource);
program.addCommand(auditResource);

program.parse();
