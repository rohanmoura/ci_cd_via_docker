export const serviceNames = ["web", "http-server", "ws-server"] as const;

export type ServiceName = (typeof serviceNames)[number];

export interface Message {
  id: string;
  content: string;
  createdAt: string;
}

export interface MessagesResponse {
  messages: Message[];
}

export interface CreateMessageResponse {
  message: Message;
}

export interface CreateMessageRequest {
  content: string;
}

export interface HealthResponse {
  status: "ok";
  service: "http-server" | "ws-server";
  timestamp: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{
      path: string;
      message: string;
    }>;
  };
}

export interface MessageCreatedEvent {
  type: "message.created";
  data: Message;
}
