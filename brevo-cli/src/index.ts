#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { profileCommand } from "./commands/profile.js";
import { contactsResource } from "./resources/contacts.js";
import { campaignsResource } from "./resources/campaigns.js";
import { transactionalResource } from "./resources/transactional.js";
import { listsResource } from "./resources/lists.js";
import { templatesResource } from "./resources/templates.js";
import { sendersResource } from "./resources/senders.js";
import { webhooksResource } from "./resources/webhooks.js";
import { smsCampaignsResource } from "./resources/sms-campaigns.js";
import { foldersResource } from "./resources/folders.js";
import { attributesResource } from "./resources/attributes.js";
import { segmentsResource } from "./resources/segments.js";
import { crmCompaniesResource } from "./resources/crm-companies.js";
import { crmDealsResource } from "./resources/crm-deals.js";
import { crmTasksResource } from "./resources/crm-tasks.js";
import { crmNotesResource } from "./resources/crm-notes.js";
import { ecommerceResource } from "./resources/ecommerce.js";
import { accountResource } from "./resources/account.js";
import { eventsResource } from "./resources/events.js";
import { whatsappCampaignsResource } from "./resources/whatsapp-campaigns.js";

const program = new Command();

program
  .name("brevo-cli")
  .description("CLI for the Brevo API — contacts, campaigns, transactional, CRM, ecommerce & more")
  .version("0.2.0")
  .option("--profile <name>", "Use a specific profile (overrides default)")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json, csv, yaml", "text")
  .option("--verbose", "Enable debug logging", false)
  .option("--no-color", "Disable colored output")
  .option("--no-header", "Omit table/csv headers (for piping)")
  .hook("preAction", (_thisCmd, actionCmd) => {
    const root = actionCmd.optsWithGlobals();
    globalFlags.json = root.json ?? false;
    globalFlags.format = root.format ?? "text";
    globalFlags.verbose = root.verbose ?? false;
    globalFlags.noColor = root.color === false;
    globalFlags.noHeader = root.header === false;
    globalFlags.profile = root.profile ?? null;
  });

// Built-in commands
program.addCommand(profileCommand);
program.addCommand(authCommand);

// Resources
program.addCommand(contactsResource);
program.addCommand(campaignsResource);
program.addCommand(transactionalResource);
program.addCommand(listsResource);
program.addCommand(templatesResource);
program.addCommand(sendersResource);
program.addCommand(webhooksResource);
program.addCommand(smsCampaignsResource);
program.addCommand(foldersResource);
program.addCommand(attributesResource);
program.addCommand(segmentsResource);
program.addCommand(crmCompaniesResource);
program.addCommand(crmDealsResource);
program.addCommand(crmTasksResource);
program.addCommand(crmNotesResource);
program.addCommand(ecommerceResource);
program.addCommand(accountResource);
program.addCommand(eventsResource);
program.addCommand(whatsappCampaignsResource);

program.parse();
