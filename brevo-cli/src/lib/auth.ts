import { getActiveProfile, saveToken as configSaveToken, removeToken as configRemoveToken } from "./config.js";
import { CliError } from "./errors.js";

// Brevo uses api-key auth via the "api-key" header
const AUTH_TYPE = "api-key";
const AUTH_HEADER = "api-key";

/** Check if a token is configured in the active profile */
export function hasToken(): boolean {
  return !!getActiveProfile()?.token;
}

/** Read the token from the active profile. Throws if not configured. */
export function getToken(): string {
  const profile = getActiveProfile();
  if (!profile?.token) {
    throw new CliError(2, "No token configured.", "Run: brevo-cli profile add --name default --url https://api.brevo.com/v3 --token <api-key>");
  }
  return profile.token;
}

/** Save a token to the active profile. */
export function setToken(token: string): void {
  configSaveToken(token);
}

/** Remove token from the active profile. */
export function removeToken(): void {
  configRemoveToken();
}

/** Mask a token for display: "sk-abc...wxyz" */
export function maskToken(token: string): string {
  if (token.length <= 8) return "****";
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

/** Build the auth header based on configured auth type. */
export function buildAuthHeaders(): Record<string, string> {
  const token = getToken();

  switch (AUTH_TYPE) {
    case "bearer":
      return { [AUTH_HEADER]: `Bearer ${token}` };
    case "api-key":
      return { [AUTH_HEADER]: token };
    case "basic":
      return { Authorization: `Basic ${Buffer.from(token).toString("base64")}` };
    default:
      return { [AUTH_HEADER]: token };
  }
}
