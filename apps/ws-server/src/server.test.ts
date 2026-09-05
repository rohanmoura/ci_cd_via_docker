import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type {
  ConnectionReadyEvent,
  ErrorResponse,
  MessageCreatedEvent,
  PongEvent,
} from "@ci-cd-via-docker/shared";

import type { WebSocketServerConfig } from "./config";
import { startWebSocketServer } from "./server";

const testConfig: WebSocketServerConfig = {
  allowedOrigin: "http://localhost:3000",
  hostname: "127.0.0.1",
  internalToken: "test-internal-token",
  port: 0,
};

let server: ReturnType<typeof startWebSocketServer>;

beforeEach(() => {
  server = startWebSocketServer(testConfig);
});

afterEach(async () => {
  await server.stop(true);
});

function websocketUrl() {
  return server.url.href.replace(/^http/, "ws");
}

function waitForOpen(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.addEventListener("open", () => resolve(), { once: true });
    socket.addEventListener(
      "error",
      () => reject(new Error("Socket failed to open.")),
      {
        once: true,
      },
    );
  });
}

function waitForEvent<T extends { type: string }>(
  socket: WebSocket,
  type: T["type"],
): Promise<T> {
  return new Promise((resolve) => {
    const handleMessage = (event: MessageEvent) => {
      const parsed = JSON.parse(String(event.data)) as T;
      if (parsed.type !== type) return;

      socket.removeEventListener("message", handleMessage);
      resolve(parsed);
    };

    socket.addEventListener("message", handleMessage);
  });
}

describe("WebSocket server", () => {
  test("reports its health and connection count", async () => {
    const response = await fetch(new URL("/health", server.url));
    const body = (await response.json()) as { connections: number };

    expect(response.status).toBe(200);
    expect(body.connections).toBe(0);
  });

  test("rejects event publishing without the internal token", async () => {
    const response = await fetch(new URL("/events", server.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = (await response.json()) as ErrorResponse;

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("rejects WebSocket connections from another browser origin", async () => {
    const response = await fetch(server.url, {
      headers: {
        Connection: "Upgrade",
        Origin: "https://untrusted.example",
        Upgrade: "websocket",
      },
    });

    expect(response.status).toBe(403);
  });

  test("opens a connection and replies to ping events", async () => {
    const socket = new WebSocket(websocketUrl(), {
      headers: { Origin: testConfig.allowedOrigin },
    });
    const readyPromise = waitForEvent<ConnectionReadyEvent>(
      socket,
      "connection.ready",
    );

    await waitForOpen(socket);
    const ready = await readyPromise;
    expect(ready.data.clientId).toBeString();

    const pongPromise = waitForEvent<PongEvent>(socket, "pong");
    socket.send(JSON.stringify({ type: "ping" }));
    const pong = await pongPromise;

    expect(new Date(pong.data.timestamp).toString()).not.toBe("Invalid Date");
    socket.close();
  });

  test("broadcasts authenticated message events to subscribers", async () => {
    const socket = new WebSocket(websocketUrl(), {
      headers: { Origin: testConfig.allowedOrigin },
    });
    await waitForOpen(socket);

    const event: MessageCreatedEvent = {
      type: "message.created",
      data: {
        id: "message-1",
        content: "A realtime message",
        createdAt: new Date().toISOString(),
      },
    };
    const messagePromise = waitForEvent<MessageCreatedEvent>(
      socket,
      "message.created",
    );

    const response = await fetch(new URL("/events", server.url), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testConfig.internalToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });
    const received = await messagePromise;

    expect(response.status).toBe(202);
    expect(received).toEqual(event);
    socket.close();
  });
});
