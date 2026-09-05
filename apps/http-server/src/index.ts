import { createDatabase } from "@ci-cd-via-docker/database";

import { createApp } from "./app";
import { loadConfig } from "./config";
import { HttpMessageEventPublisher } from "./events/message-event-publisher";
import { PostgresMessageStore } from "./store/postgres-message-store";

const config = loadConfig();
const database = createDatabase(config.databaseUrl);
const store = new PostgresMessageStore(database.db);

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
  await database.close();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
