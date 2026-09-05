import type {
  ConnectionReadyEvent,
  ErrorResponse,
  HealthResponse,
  MessageCreatedEvent,
  PongEvent,
} from "@ci-cd-via-docker/shared";
import { z } from "zod";

import type { WebSocketServerConfig } from "./config";

const MESSAGE_TOPIC = "messages";

const messageCreatedEventSchema = z.object({
  type: z.literal("message.created"),
  data: z.object({
    id: z.string().min(1),
    content: z.string().min(1).max(280),
    createdAt: z.string().min(1),
  }),
});

interface SocketData {
  clientId: string;
  connectedAt: string;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function startWebSocketServer(config: WebSocketServerConfig) {
  const server = Bun.serve({
    hostname: config.hostname,
    port: config.port,

    async fetch(request, bunServer) {
      const url = new URL(request.url);

      if (request.method === "GET" && url.pathname === "/health") {
        const response: HealthResponse & { connections: number } = {
          status: "ok",
          service: "ws-server",
          timestamp: new Date().toISOString(),
          connections: bunServer.subscriberCount(MESSAGE_TOPIC),
        };

        return json(response);
      }

      if (request.method === "POST" && url.pathname === "/events") {
        const authorization = request.headers.get("Authorization");
        if (authorization !== `Bearer ${config.internalToken}`) {
          const response: ErrorResponse = {
            error: {
              code: "UNAUTHORIZED",
              message: "A valid internal service token is required.",
            },
          };

          return json(response, 401);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          const response: ErrorResponse = {
            error: {
              code: "INVALID_JSON",
              message: "Request body must contain valid JSON.",
            },
          };

          return json(response, 400);
        }

        const result = messageCreatedEventSchema.safeParse(body);
        if (!result.success) {
          const response: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: "The message event does not match the expected schema.",
            },
          };

          return json(response, 422);
        }

        const event: MessageCreatedEvent = result.data;
        const connections = bunServer.subscriberCount(MESSAGE_TOPIC);
        const deliveryResult = bunServer.publish(
          MESSAGE_TOPIC,
          JSON.stringify(event),
        );

        return json({ accepted: true, connections, deliveryResult }, 202);
      }

      if (
        request.method === "GET" &&
        (url.pathname === "/" || url.pathname === "/ws")
      ) {
        const origin = request.headers.get("Origin");
        if (origin !== null && origin !== config.allowedOrigin) {
          const response: ErrorResponse = {
            error: {
              code: "ORIGIN_NOT_ALLOWED",
              message: "This origin cannot open a WebSocket connection.",
            },
          };

          return json(response, 403);
        }

        const upgraded = bunServer.upgrade(request, {
          data: {
            clientId: crypto.randomUUID(),
            connectedAt: new Date().toISOString(),
          },
        });

        if (upgraded) return undefined;

        const response: ErrorResponse = {
          error: {
            code: "UPGRADE_REQUIRED",
            message: "Use a WebSocket client to connect to this route.",
          },
        };

        return json(response, 426);
      }

      const response: ErrorResponse = {
        error: {
          code: "NOT_FOUND",
          message: `Route ${request.method} ${url.pathname} was not found.`,
        },
      };

      return json(response, 404);
    },

    websocket: {
      data: {} as SocketData,
      idleTimeout: 120,
      maxPayloadLength: 64 * 1024,

      open(socket) {
        socket.subscribe(MESSAGE_TOPIC);

        const event: ConnectionReadyEvent = {
          type: "connection.ready",
          data: {
            clientId: socket.data.clientId,
            connectedAt: socket.data.connectedAt,
          },
        };

        socket.send(JSON.stringify(event));
      },

      message(socket, message) {
        let parsed: unknown;

        try {
          parsed = JSON.parse(String(message));
        } catch {
          socket.send(
            JSON.stringify({
              type: "connection.error",
              data: { message: "WebSocket messages must be valid JSON." },
            }),
          );
          return;
        }

        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "type" in parsed &&
          parsed.type === "ping"
        ) {
          const event: PongEvent = {
            type: "pong",
            data: { timestamp: new Date().toISOString() },
          };
          socket.send(JSON.stringify(event));
          return;
        }

        socket.send(
          JSON.stringify({
            type: "connection.error",
            data: { message: "Unsupported WebSocket event." },
          }),
        );
      },

      close(socket) {
        socket.unsubscribe(MESSAGE_TOPIC);
      },
    },
  });

  return server;
}
