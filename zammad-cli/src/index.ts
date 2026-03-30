#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { profileCommand } from "./commands/profile.js";
import { ticketsCommand } from "./resources/tickets.js";
import { usersCommand } from "./resources/users.js";
import { orgsCommand } from "./resources/orgs.js";
import { groupsCommand } from "./resources/groups.js";
import { tagsCommand } from "./resources/tags.js";

const program = new Command();

program
  .name("zammad-cli")
  .description("CLI for the Zammad helpdesk API")
  .version("1.0.0")
  .option("--json", "Output as JSON", false)
  .option("--profile <name>", "Use a specific helpdesk profile")
  .option("--verbose", "Enable verbose logging", false)
  .hook("preAction", (_cmd, action) => {
    const o = action.optsWithGlobals();
    globalFlags.json    = o.json    ?? false;
    globalFlags.verbose = o.verbose ?? false;
    globalFlags.profile = o.profile ?? null;
  });

program.addCommand(profileCommand);
program.addCommand(authCommand);
program.addCommand(ticketsCommand);
program.addCommand(usersCommand);
program.addCommand(orgsCommand);
program.addCommand(groupsCommand);
program.addCommand(tagsCommand);

program.parse();
