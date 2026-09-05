import type {
  CreateMessageRequest,
  CreateMessageResponse,
  ErrorResponse,
  HealthResponse,
  MessagesResponse,
} from "@ci-cd-via-docker/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { z } from "zod";

import type { MessageEventPublisher } from "./events/message-event-publisher";
import { InMemoryMessageStore, type MessageStore } from "./store/message-store";

const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(280),
});

interface CreateAppOptions {
  corsOrigin?: string;
  enableRequestLogging?: boolean;
  eventPublisher?: MessageEventPublisher;
  onPublishError?: (error: unknown) => void;
  store?: MessageStore;
}

export function createApp(options: CreateAppOptions = {}) {
  const app = new Hono();
  const store = options.store ?? new InMemoryMessageStore();
  const corsOrigin = options.corsOrigin ?? "http://localhost:3000";

  if (options.enableRequestLogging) app.use("*", logger());

  app.use(
    "*",
    cors({
      origin: corsOrigin,
      allowHeaders: ["Content-Type"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      maxAge: 600,
    }),
  );

  app.get("/health", async (context) => {
    await store.healthCheck();

    const response: HealthResponse = {
      status: "ok",
      service: "http-server",
      timestamp: new Date().toISOString(),
    };

    return context.json(response);
  });

  app.get("/messages", async (context) => {
    const response: MessagesResponse = {
      messages: await store.list(),
    };

    return context.json(response);
  });

  app.post("/messages", async (context) => {
    let body: unknown;

    try {
      body = await context.req.json();
    } catch {
      const response: ErrorResponse = {
        error: {
          code: "INVALID_JSON",
          message: "Request body must contain valid JSON.",
        },
      };

      return context.json(response, 400);
    }

    const result = createMessageSchema.safeParse(body);
    if (!result.success) {
      const response: ErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Message content must contain between 1 and 280 characters.",
          details: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      };

      return context.json(response, 422);
    }

    const request: CreateMessageRequest = result.data;
    const message = await store.create(request.content);

    if (options.eventPublisher) {
      try {
        await options.eventPublisher.publishCreated(message);
      } catch (error) {
        if (options.onPublishError) {
          options.onPublishError(error);
        } else {
          console.error(
            "Message stored, but realtime broadcast failed.",
            error,
          );
        }
      }
    }

    const response: CreateMessageResponse = {
      message,
    };

    return context.json(response, 201);
  });

  app.notFound((context) => {
    const response: ErrorResponse = {
      error: {
        code: "NOT_FOUND",
        message: `Route ${context.req.method} ${context.req.path} was not found.`,
      },
    };

    return context.json(response, 404);
  });

  app.onError((error, context) => {
    console.error("Unhandled HTTP server error", error);

    const response: ErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      },
    };

    return context.json(response, 500);
  });

  return app;
}
