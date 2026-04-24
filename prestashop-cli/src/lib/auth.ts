import { getActiveProfile } from "./config.js";
import { CliError } from "./errors.js";

/** Read the API key from the active profile. Throws if not configured. */
export function getToken(): string {
  const profile = getActiveProfile();
  if (!profile?.token) {
    throw new CliError(
      2,
      "No API key configured.",
      "Run: prestashop-cli profile add --name default --url https://yourshop.com --token <ws-key>",
    );
  }
  return profile.token;
}

/** PrestaShop WebService: Basic Auth with API key as username, no password */
export function buildAuthHeaders(): Record<string, string> {
  const token = getToken();
  return {
    Authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}`,
  };
}

export function maskToken(token: string): string {
  if (token.length <= 8) return "****";
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}
