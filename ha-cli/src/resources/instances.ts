import { Command } from "commander";
import { listInstances, addInstance, removeInstance, setActiveInstance, getActiveInstanceName } from "../lib/config.js";

export const instancesResource = new Command("instances").description("Manage Home Assistant instances");

instancesResource
  .command("list")
  .description("List all configured instances")
  .action(() => {
    const instances = listInstances();
    const active = getActiveInstanceName();
    if (!instances.length) {
      console.log("No instances configured. Run: ha-cli instances add <name> --url <url> --token <token>");
      return;
    }
    for (const inst of instances) {
      const marker = inst.name === active ? "* " : "  ";
      console.log(`${marker}${inst.name.padEnd(20)} ${inst.url}`);
    }
  });

instancesResource
  .command("add <name>")
  .description("Add a Home Assistant instance")
  .requiredOption("--url <url>", "Instance URL (e.g. http://192.168.1.100:8123)")
  .requiredOption("--token <token>", "Long-lived access token")
  .action((name, opts) => {
    addInstance(name, opts.url, opts.token);
    console.log(`✓ Instance "${name}" added (${opts.url})`);
    if (listInstances().length === 1) console.log(`  Set as active instance.`);
  });

instancesResource
  .command("use <name>")
  .description("Switch active instance")
  .action((name) => {
    setActiveInstance(name);
    const inst = listInstances().find(i => i.name === name)!;
    console.log(`✓ Active instance → "${name}" (${inst.url})`);
  });

instancesResource
  .command("remove <name>")
  .description("Remove an instance")
  .action((name) => {
    removeInstance(name);
    console.log(`✓ Instance "${name}" removed.`);
  });
