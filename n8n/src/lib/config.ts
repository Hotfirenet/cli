import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CONFIG_DIR = join(homedir(), ".config", "tokens");
const TOKEN_FILE = join(CONFIG_DIR, "n8n-cli");

export function getToken(): string | null {
  if (!existsSync(TOKEN_FILE)) return null;
  return readFileSync(TOKEN_FILE, "utf-8").trim() || null;
}

export function saveToken(token: string): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(TOKEN_FILE, token, { mode: 0o600 });
}

export function removeToken(): void {
  if (existsSync(TOKEN_FILE)) {
    const { unlinkSync } = require("fs");
    unlinkSync(TOKEN_FILE);
  }
}

export const BASE_URL = process.env.N8N_BASE_URL ?? "https://api.example.com/v1";

export const globalFlags = {
  json: false,
  format: "text",
  verbose: false,
  noColor: false,
  noHeader: false,
};
