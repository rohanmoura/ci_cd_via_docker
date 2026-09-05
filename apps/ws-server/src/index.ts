import { loadConfig } from "./config";
import { startWebSocketServer } from "./server";

const config = loadConfig();
const server = startWebSocketServer(config);

console.log(`WebSocket server listening at ${server.url}`);

let isShuttingDown = false;

async function shutdown(signal: NodeJS.Signals) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}. Closing WebSocket connections.`);
  await server.stop();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
