import { Command } from "commander";
import { getToken, saveToken, removeToken, saveBaseUrl, getBaseUrl } from "../lib/config.js";
import { client } from "../lib/client.js";

export const authCommand = new Command("auth").description("Manage API authentication");

authCommand
  .command("set <token>")
  .description("Save your API token")
  .action((token: string) => {
    saveToken(token);
    console.log("Token saved.");
  });

authCommand
  .command("show")
  .description("Show current token (masked)")
  .option("--reveal", "Show full token")
  .action((opts) => {
    const token = getToken();
    if (!token) { console.log("No token configured."); return; }
    console.log(opts.reveal ? token : `${token.slice(0, 8)}...${token.slice(-4)}`);
  });

authCommand
  .command("remove")
  .description("Delete the saved token")
  .action(() => {
    removeToken();
    console.log("Token removed.");
  });

authCommand
  .command("test")
  .description("Test the API connection")
  .action(async () => {
    try {
      const me = await client.get("/users/me") as Record<string, unknown>;
      console.log(`Connection OK. Logged in as: ${me.email ?? me.login} (#${me.id})`);
    } catch (err) {
      console.error("Connection failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

authCommand
  .command("url <url>")
  .description("Set the Zammad base URL (e.g. https://support.example.com)")
  .action((url: string) => {
    saveBaseUrl(url);
    console.log(`URL saved: ${getBaseUrl()}`);
  });
