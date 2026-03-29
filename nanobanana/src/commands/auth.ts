import { Command } from "commander";
import { getToken, saveToken, removeToken } from "../lib/config.js";
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
      await client.get("/");
      console.log("Connection OK.");
    } catch (err) {
      console.error("Connection failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });
