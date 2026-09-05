const DEFAULT_WS_SERVER_PORT = 3002;
const DEFAULT_CORS_ORIGIN = "http://localhost:3000";
const DEFAULT_INTERNAL_TOKEN = "local-development-token";

function parsePort(value: string | undefined): number {
  if (value === undefined || value === "") return DEFAULT_WS_SERVER_PORT;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error(
      `WS_SERVER_PORT must be an integer between 0 and 65535. Received: ${value}`,
    );
  }

  return port;
}

export interface WebSocketServerConfig {
  allowedOrigin: string;
  hostname: string;
  internalToken: string;
  port: number;
}

export function loadConfig(
  environment: Record<string, string | undefined> = Bun.env,
): WebSocketServerConfig {
  return {
    allowedOrigin: environment.CORS_ORIGIN || DEFAULT_CORS_ORIGIN,
    hostname: environment.WS_SERVER_HOST || "0.0.0.0",
    internalToken: environment.WS_INTERNAL_TOKEN || DEFAULT_INTERNAL_TOKEN,
    port: parsePort(environment.WS_SERVER_PORT),
  };
}
