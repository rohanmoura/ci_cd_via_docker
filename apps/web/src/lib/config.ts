const DEFAULT_HTTP_SERVER_URL = "http://localhost:3001";
const DEFAULT_WS_SERVER_URL = "ws://localhost:3002";

export const HTTP_SERVER_URL =
  process.env.NEXT_PUBLIC_HTTP_SERVER_URL ?? DEFAULT_HTTP_SERVER_URL;

export const WS_SERVER_URL =
  process.env.NEXT_PUBLIC_WS_SERVER_URL ?? DEFAULT_WS_SERVER_URL;
