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

export interface MessageCreatedEvent {
  type: "message.created";
  data: Message;
}
