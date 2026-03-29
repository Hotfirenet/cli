export class CliError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "CliError";
  }
}

export function handleError(err: unknown, asJson = false): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (asJson) {
    console.error(JSON.stringify({ error: msg }));
  } else {
    console.error(`Error: ${msg}`);
  }
  process.exit(1);
}
