import type { Message, MessageCreatedEvent } from "@ci-cd-via-docker/shared";

export interface MessageEventPublisher {
  publishCreated(message: Message): Promise<void>;
}

export class HttpMessageEventPublisher implements MessageEventPublisher {
  constructor(
    private readonly eventUrl: string,
    private readonly internalToken: string,
  ) {}

  async publishCreated(message: Message): Promise<void> {
    const event: MessageCreatedEvent = {
      type: "message.created",
      data: message,
    };

    const response = await fetch(this.eventUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.internalToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(2_000),
    });

    if (!response.ok) {
      throw new Error(
        `WebSocket event server responded with HTTP ${response.status}.`,
      );
    }
  }
}
