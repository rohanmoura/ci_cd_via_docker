import { beforeEach, describe, expect, test } from "bun:test";
import type {
  CreateMessageResponse,
  ErrorResponse,
  HealthResponse,
  Message,
  MessagesResponse,
} from "@ci-cd-via-docker/shared";

import { createApp } from "./app";
import type { MessageEventPublisher } from "./events/message-event-publisher";
import { InMemoryMessageStore } from "./store/message-store";

let store: InMemoryMessageStore;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  store = new InMemoryMessageStore();
  app = createApp({ corsOrigin: "http://localhost:3000", store });
});

describe("HTTP server", () => {
  test("reports its health", async () => {
    const response = await app.request("/health");
    const body = (await response.json()) as HealthResponse;

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("http-server");
    expect(new Date(body.timestamp).toString()).not.toBe("Invalid Date");
  });

  test("starts with an empty message list", async () => {
    const response = await app.request("/messages");
    const body = (await response.json()) as MessagesResponse;

    expect(response.status).toBe(200);
    expect(body).toEqual({ messages: [] });
  });

  test("creates and stores a valid message", async () => {
    const createResponse = await app.request("/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "  Hello from Bun  " }),
    });
    const created = (await createResponse.json()) as CreateMessageResponse;

    expect(createResponse.status).toBe(201);
    expect(created.message.content).toBe("Hello from Bun");
    expect(created.message.id).toBeString();

    const listResponse = await app.request("/messages");
    const list = (await listResponse.json()) as MessagesResponse;
    expect(list.messages).toEqual([created.message]);
  });

  test("publishes the created message for realtime delivery", async () => {
    let publishedMessage: Message | undefined;
    const publisher: MessageEventPublisher = {
      async publishCreated(message) {
        publishedMessage = message;
      },
    };
    app = createApp({ eventPublisher: publisher, store });

    const response = await app.request("/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Broadcast me" }),
    });
    const created = (await response.json()) as CreateMessageResponse;

    expect(response.status).toBe(201);
    expect(publishedMessage).toEqual(created.message);
  });

  test("keeps the stored message when realtime delivery fails", async () => {
    const publisher: MessageEventPublisher = {
      async publishCreated() {
        throw new Error("WebSocket server unavailable");
      },
    };
    let publishError: unknown;
    app = createApp({
      eventPublisher: publisher,
      onPublishError: (error) => {
        publishError = error;
      },
      store,
    });

    const response = await app.request("/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Keep this message" }),
    });

    expect(response.status).toBe(201);
    expect(publishError).toBeInstanceOf(Error);
    expect((await store.list()).map((message) => message.content)).toEqual([
      "Keep this message",
    ]);
  });

  test("rejects invalid message content", async () => {
    const response = await app.request("/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "   " }),
    });
    const body = (await response.json()) as ErrorResponse;

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects malformed JSON", async () => {
    const response = await app.request("/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const body = (await response.json()) as ErrorResponse;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_JSON");
  });

  test("returns a JSON 404 response", async () => {
    const response = await app.request("/missing");
    const body = (await response.json()) as ErrorResponse;

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  test("allows requests from the configured browser origin", async () => {
    const response = await app.request("/messages", {
      headers: { Origin: "http://localhost:3000" },
    });

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000",
    );
  });
});
