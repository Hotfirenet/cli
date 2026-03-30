import { Command } from "commander";
import {
  listProfiles,
  getDefaultProfileName,
  saveProfile,
  deleteProfile,
  setDefaultProfile,
  getProfile,
} from "../lib/config.js";
import { client } from "../lib/client.js";
import { printTable, printRecord, success } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const profileCommand = new Command("profile").description("Manage helpdesk profiles (multiple instances)");

profileCommand
  .command("list")
  .description("List all configured profiles")
  .option("--json", "Output as JSON")
  .action((opts) => {
    const profiles = listProfiles();
    const defaultName = getDefaultProfileName();

    if (opts.json) {
      console.log(JSON.stringify({ default: defaultName, profiles }, null, 2));
      return;
    }

    const entries = Object.entries(profiles);
    if (!entries.length) {
      console.log("No profiles configured. Run: zammad-cli profile add --name prod --url https://... --token ...");
      return;
    }

    printTable(
      entries.map(([name, p]) => ({
        name: name === defaultName ? `${name} *` : name,
        url: p.url.replace(/\/api\/v1$/, ""),
        token: p.token ? `${p.token.slice(0, 6)}...${p.token.slice(-3)}` : "(none)",
      })),
      ["name", "url", "token"],
      "Profiles  (* = default)"
    );
  });

profileCommand
  .command("add")
  .description("Add or update a helpdesk profile")
  .requiredOption("--name <s>", "Profile name (e.g. prod, staging)")
  .requiredOption("--url <s>", "Zammad URL (e.g. https://support.example.com)")
  .requiredOption("--token <s>", "API token")
  .option("--default", "Set as default profile")
  .action((opts) => {
    saveProfile(opts.name, opts.url, opts.token, opts.default ?? false);
    success(`Profile '${opts.name}' saved.${opts.default ? " (set as default)" : ""}`);
  });

profileCommand
  .command("use <name>")
  .description("Set the default profile")
  .action((name) => {
    if (!setDefaultProfile(name)) {
      console.error(`Profile '${name}' not found.`);
      process.exit(1);
    }
    success(`Default profile set to '${name}'.`);
  });

profileCommand
  .command("show <name>")
  .description("Show details of a profile")
  .action((name) => {
    const p = getProfile(name);
    if (!p) { console.error(`Profile '${name}' not found.`); process.exit(1); }
    printRecord({
      name,
      url: p.url.replace(/\/api\/v1$/, ""),
      token: p.token ? `${p.token.slice(0, 6)}...${p.token.slice(-3)}` : "(none)",
    }, undefined, `Profile: ${name}`);
  });

profileCommand
  .command("remove <name>")
  .description("Remove a profile")
  .option("--yes", "Skip confirmation")
  .action(async (name, opts) => {
    if (!opts.yes) {
      process.stdout.write(`Remove profile '${name}'? [y/N] `);
      const answer = await new Promise<string>(r => process.stdin.once("data", d => r(d.toString().trim())));
      if (!["y", "yes"].includes(answer.toLowerCase())) { console.log("Aborted."); return; }
    }
    if (!deleteProfile(name)) { console.error(`Profile '${name}' not found.`); process.exit(1); }
    success(`Profile '${name}' removed.`);
  });

profileCommand
  .command("test [name]")
  .description("Test connection for a profile (defaults to active profile)")
  .action(async (name) => {
    if (name) {
      const p = getProfile(name);
      if (!p) { console.error(`Profile '${name}' not found.`); process.exit(1); }
      // Temporarily override
      const { globalFlags } = await import("../lib/config.js");
      globalFlags.profile = name;
    }
    try {
      const me = await client.get("/users/me") as Record<string, unknown>;
      success(`Connection OK — logged in as: ${me.email ?? me.login} (#${me.id})`);
    } catch (err) { handleError(err); }
  });
