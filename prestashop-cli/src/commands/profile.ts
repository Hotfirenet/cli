import { Command } from "commander";
import {
  listProfiles,
  getDefaultProfileName,
  saveProfile,
  deleteProfile,
  setDefaultProfile,
  getProfile,
  globalFlags,
} from "../lib/config.js";
import { client } from "../lib/client.js";

export const profileCommand = new Command("profile").description(
  "Manage shop profiles (multiple PrestaShop instances)",
);

profileCommand
  .command("list")
  .description("List all configured profiles")
  .option("--json", "Output as JSON")
  .action((opts) => {
    const profiles = listProfiles();
    const def = getDefaultProfileName();
    if (opts.json) { console.log(JSON.stringify({ default: def, profiles }, null, 2)); return; }
    const entries = Object.entries(profiles);
    if (!entries.length) {
      console.log("No profiles. Run: prestashop-cli profile add --name prod --url https://myshop.com --token <ws-key>");
      return;
    }
    const rows = entries.map(([n, p]) => ({
      name: n === def ? `${n} *` : n,
      url: p.url,
      token: p.token ? `${p.token.slice(0, 6)}...${p.token.slice(-3)}` : "(none)",
    }));
    const w = { name: 4, url: 3, token: 5 };
    for (const r of rows) {
      w.name = Math.max(w.name, r.name.length);
      w.url = Math.max(w.url, r.url.length);
      w.token = Math.max(w.token, r.token.length);
    }
    console.log(`\n  ${"NAME".padEnd(w.name)}  ${"URL".padEnd(w.url)}  TOKEN`);
    console.log(`  ${"─".repeat(w.name)}  ${"─".repeat(w.url)}  ${"─".repeat(w.token)}`);
    for (const r of rows) {
      console.log(`  ${r.name.padEnd(w.name)}  ${r.url.padEnd(w.url)}  ${r.token}`);
    }
    console.log("\n  * = default\n");
  });

profileCommand
  .command("add")
  .description("Add or update a profile")
  .requiredOption("--name <s>", "Profile name (e.g. prod, staging)")
  .requiredOption("--url <s>", "PrestaShop shop URL (e.g. https://myshop.com)")
  .requiredOption("--token <s>", "WebService API key")
  .option("--default", "Set as default profile")
  .action((opts) => {
    saveProfile(opts.name, opts.url, opts.token, opts.default ?? false);
    console.log(`✓ Profile '${opts.name}' saved.${opts.default ? " (set as default)" : ""}`);
  });

profileCommand
  .command("use <name>")
  .description("Set the default profile")
  .action((name) => {
    if (!setDefaultProfile(name)) { console.error(`Profile '${name}' not found.`); process.exit(1); }
    console.log(`✓ Default profile set to '${name}'.`);
  });

profileCommand
  .command("show <name>")
  .description("Show a profile's details")
  .action((name) => {
    const p = getProfile(name);
    if (!p) { console.error(`Profile '${name}' not found.`); process.exit(1); }
    console.log(`\n  name   ${name}\n  url    ${p.url}\n  token  ${p.token ? `${p.token.slice(0, 6)}...${p.token.slice(-3)}` : "(none)"}\n`);
  });

profileCommand
  .command("remove <name>")
  .description("Remove a profile")
  .option("--yes", "Skip confirmation")
  .action(async (name, opts) => {
    if (!opts.yes) {
      process.stdout.write(`Remove profile '${name}'? [y/N] `);
      const answer = await new Promise<string>((r) =>
        process.stdin.once("data", (d) => r(d.toString().trim())),
      );
      if (!["y", "yes"].includes(answer.toLowerCase())) { console.log("Aborted."); return; }
    }
    if (!deleteProfile(name)) { console.error(`Profile '${name}' not found.`); process.exit(1); }
    console.log(`✓ Profile '${name}' removed.`);
  });

profileCommand
  .command("test [name]")
  .description("Test connection for a profile (defaults to active profile)")
  .action(async (name) => {
    if (name) {
      if (!getProfile(name)) { console.error(`Profile '${name}' not found.`); process.exit(1); }
      globalFlags.profile = name;
    }
    try {
      await client.get("/");
      console.log(`✓ Connection OK${name ? ` (${name})` : ""}.`);
    } catch (err) {
      console.error("Connection failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });
