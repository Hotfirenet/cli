import { Command } from "commander";
import { getToken, saveToken, saveBaseUrl, getBaseUrl, removeToken } from "../lib/config.js";
import { maskToken } from "../lib/auth.js";
import { client } from "../lib/client.js";

export const authCommand = new Command("auth").description(
  "Manage authentication for the active profile",
);

authCommand
  .command("set <key>")
  .description("Save WebService API key for the active profile")
  .action((key: string) => {
    saveToken(key);
    console.log("API key saved.");
  });

authCommand
  .command("url <url>")
  .description("Set the PrestaShop shop URL (e.g. https://myshop.com)")
  .action((url: string) => {
    saveBaseUrl(url);
    console.log(`URL saved: ${getBaseUrl()}`);
  });

authCommand
  .command("show")
  .description("Show the API key for the active profile (masked by default)")
  .option("--reveal", "Show the full API key")
  .action((opts) => {
    const token = getToken();
    if (!token) { console.log("No API key configured."); return; }
    console.log(opts.reveal ? token : maskToken(token));
    console.log(`URL: ${getBaseUrl()}`);
  });

authCommand
  .command("remove")
  .description("Remove the API key for the active profile")
  .action(() => {
    removeToken();
    console.log("API key removed.");
  });

authCommand
  .command("test")
  .description("Test the WebService connection for the active profile")
  .action(async () => {
    try {
      await client.get("/");
      console.log("Connection OK.");
    } catch (err) {
      console.error("Connection failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });
