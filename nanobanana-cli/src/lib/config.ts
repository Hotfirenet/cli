import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CONFIG_DIR = join(homedir(), ".config", "tokens");
const PROFILES_FILE = join(CONFIG_DIR, "nanobanana-cli-profiles.json");

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Profile {
  url: string;
  token: string;
}

interface ProfilesStore {
  default: string | null;
  profiles: Record<string, Profile>;
}

// ─── Global runtime flags (set by --profile in index.ts) ─────────────────────

export const globalFlags = {
  json: false,
  format: "text",
  verbose: false,
  profile: null as string | null,
};

// ─── Profiles file I/O ────────────────────────────────────────────────────────

function loadProfiles(): ProfilesStore {
  // Migrate legacy single-file config on first read
  if (!existsSync(PROFILES_FILE)) {
    const legacyToken = join(CONFIG_DIR, "nanobanana-cli");
    if (existsSync(legacyToken)) {
      const token = readFileSync(legacyToken, "utf-8").trim();
      const store: ProfilesStore = { default: "default", profiles: { default: { url: "http://localhost/api", token } } };
      _saveProfiles(store);
      return store;
    }
    return { default: null, profiles: {} };
  }
  try { return JSON.parse(readFileSync(PROFILES_FILE, "utf-8")) as ProfilesStore; }
  catch { return { default: null, profiles: {} }; }
}

function _saveProfiles(store: ProfilesStore): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(PROFILES_FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
}

function _normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

// ─── Public profile API ───────────────────────────────────────────────────────

export function listProfiles(): Record<string, Profile> {
  return loadProfiles().profiles;
}

export function getDefaultProfileName(): string | null {
  return loadProfiles().default;
}

export function getProfile(name: string): Profile | null {
  return loadProfiles().profiles[name] ?? null;
}

export function getActiveProfile(): Profile | null {
  if (process.env.NANOBANANA_URL && process.env.NANOBANANA_TOKEN) {
    return { url: process.env.NANOBANANA_URL!, token: process.env.NANOBANANA_TOKEN! };
  }
  const store = loadProfiles();
  const name = globalFlags.profile ?? store.default;
  return name ? (store.profiles[name] ?? null) : null;
}

export function saveProfile(name: string, url: string, token: string, setDefault = false): void {
  const store = loadProfiles();
  store.profiles[name] = { url: _normalizeUrl(url), token };
  if (setDefault || !store.default) store.default = name;
  _saveProfiles(store);
}

export function deleteProfile(name: string): boolean {
  const store = loadProfiles();
  if (!store.profiles[name]) return false;
  delete store.profiles[name];
  if (store.default === name) {
    const remaining = Object.keys(store.profiles);
    store.default = remaining[0] ?? null;
  }
  _saveProfiles(store);
  return true;
}

export function setDefaultProfile(name: string): boolean {
  const store = loadProfiles();
  if (!store.profiles[name]) return false;
  store.default = name;
  _saveProfiles(store);
  return true;
}

// ─── Legacy single-profile helpers (used by auth command) ────────────────────

export function getToken(): string | null {
  return getActiveProfile()?.token ?? null;
}

export function getBaseUrl(): string {
  return getActiveProfile()?.url ?? "http://localhost/api";
}

export function saveToken(token: string): void {
  const store = loadProfiles();
  const name = globalFlags.profile ?? store.default ?? "default";
  const existing = store.profiles[name];
  if (existing) { existing.token = token; _saveProfiles(store); }
  else saveProfile(name, "http://localhost/api", token, true);
}

export function saveBaseUrl(url: string): void {
  const store = loadProfiles();
  const name = globalFlags.profile ?? store.default ?? "default";
  const existing = store.profiles[name];
  if (existing) { existing.url = _normalizeUrl(url); _saveProfiles(store); }
  else saveProfile(name, url, "", true);
}

export function removeToken(): void {
  const store = loadProfiles();
  const name = globalFlags.profile ?? store.default;
  if (name && store.profiles[name]) { store.profiles[name].token = ""; _saveProfiles(store); }
}
