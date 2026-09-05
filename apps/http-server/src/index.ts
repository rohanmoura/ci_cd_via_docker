import { createApp } from "./app";
import { loadConfig } from "./config";
import { HttpMessageEventPublisher } from "./events/message-event-publisher";
import { InMemoryMessageStore } from "./store/message-store";

const config = loadConfig();
const store = new InMemoryMessageStore([
  {
    id: "welcome-message",
    content:
      "HTTP server is online. The database will replace this memory store in Phase 6.",
    createdAt: new Date().toISOString(),
  },
]);

const app = createApp({
  corsOrigin: config.corsOrigin,
  enableRequestLogging: true,
  eventPublisher: new HttpMessageEventPublisher(
    config.wsEventUrl,
    config.wsInternalToken,
  ),
  store,
});

const server = Bun.serve({
  hostname: config.hostname,
  port: config.port,
  fetch: app.fetch,
});

console.log(`HTTP server listening at ${server.url}`);

let isShuttingDown = false;

async function shutdown(signal: NodeJS.Signals) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}. Finishing active requests before shutdown.`);
  await server.stop();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
