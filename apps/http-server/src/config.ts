const DEFAULT_HTTP_SERVER_PORT = 3001;
const DEFAULT_CORS_ORIGIN = "http://localhost:3000";

function parsePort(value: string | undefined): number {
  if (value === undefined || value === "") return DEFAULT_HTTP_SERVER_PORT;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(
      `HTTP_SERVER_PORT must be an integer between 1 and 65535. Received: ${value}`,
    );
  }

  return port;
}

export interface HttpServerConfig {
  corsOrigin: string;
  hostname: string;
  port: number;
  wsEventUrl: string;
  wsInternalToken: string;
}

export function loadConfig(
  environment: Record<string, string | undefined> = Bun.env,
): HttpServerConfig {
  return {
    corsOrigin: environment.CORS_ORIGIN || DEFAULT_CORS_ORIGIN,
    hostname: environment.HTTP_SERVER_HOST || "0.0.0.0",
    port: parsePort(environment.HTTP_SERVER_PORT),
    wsEventUrl:
      environment.WS_INTERNAL_EVENT_URL || "http://localhost:3002/events",
    wsInternalToken: environment.WS_INTERNAL_TOKEN || "local-development-token",
  };
}
