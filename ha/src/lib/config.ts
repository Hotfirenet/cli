import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CONFIG_DIR = join(homedir(), ".config", "ha-cli");
const CONFIG_FILE = join(CONFIG_DIR, "instances.json");

export interface Instance {
  name: string;
  url: string;
  token: string;
}

interface Config {
  active: string;
  instances: Record<string, Instance>;
}

function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) return { active: "", instances: {} };
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return { active: "", instances: {} };
  }
}

function saveConfig(config: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function listInstances(): Instance[] {
  const config = loadConfig();
  return Object.values(config.instances);
}

export function getInstance(name?: string): Instance | null {
  const config = loadConfig();
  const key = name ?? config.active;
  return config.instances[key] ?? null;
}

export function addInstance(name: string, url: string, token: string): void {
  const config = loadConfig();
  config.instances[name] = { name, url: url.replace(/\/$/, ""), token };
  if (!config.active) config.active = name;
  saveConfig(config);
}

export function removeInstance(name: string): void {
  const config = loadConfig();
  delete config.instances[name];
  if (config.active === name) {
    config.active = Object.keys(config.instances)[0] ?? "";
  }
  saveConfig(config);
}

export function setActiveInstance(name: string): void {
  const config = loadConfig();
  if (!config.instances[name]) throw new Error(`Instance "${name}" not found`);
  config.active = name;
  saveConfig(config);
}

export function getActiveInstanceName(): string {
  return loadConfig().active;
}

// Legacy compat — used by auth command and client.ts
export function getToken(instanceName?: string): string | null {
  return getInstance(instanceName)?.token ?? null;
}

export function saveToken(_token: string): void {
  throw new Error("Use: ha-cli instances add <name> --url <url> --token <token>");
}

export function removeToken(): void {
  throw new Error("Use: ha-cli instances remove <name>");
}

export function getBaseUrl(instanceName?: string): string {
  const inst = getInstance(instanceName);
  if (inst) return `${inst.url}/api`;
  return process.env.HA_BASE_URL ?? "http://homeassistant.local:8123/api";
}

export const globalFlags = {
  json: false,
  format: "text",
  verbose: false,
  noColor: false,
  noHeader: false,
  instance: "" as string,
};
