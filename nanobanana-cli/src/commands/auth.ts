import { Command } from "commander";
import { getToken, saveToken, saveBaseUrl, getBaseUrl, removeToken } from "../lib/config.js";
import { client } from "../lib/client.js";

export const authCommand = new Command("auth").description("Manage authentication for the active profile");

authCommand
  .command("set <token>")
  .description("Save API token for the active profile")
  .action((token: string) => {
    saveToken(token);
    console.log("Token saved.");
  });

authCommand
  .command("url <url>")
  .description("Set the base URL for the active profile")
  .action((url: string) => {
    saveBaseUrl(url);
    console.log(`URL saved: ${getBaseUrl()}`);
  });

authCommand
  .command("show")
  .description("Show token for the active profile (masked)")
  .option("--reveal", "Show full token")
  .action((opts) => {
    const token = getToken();
    if (!token) { console.log("No token configured."); return; }
    console.log(opts.reveal ? token : `${token.slice(0, 8)}...${token.slice(-4)}`);
  });

authCommand
  .command("remove")
  .description("Remove token for the active profile")
  .action(() => {
    removeToken();
    console.log("Token removed.");
  });

authCommand
  .command("test")
  .description("Test the API connection for the active profile")
  .action(async () => {
    try {
      await client.get("/");
      console.log("Connection OK.");
    } catch (err) {
      console.error("Connection failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });
