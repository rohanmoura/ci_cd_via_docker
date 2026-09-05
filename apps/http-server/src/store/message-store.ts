import type { Message } from "@ci-cd-via-docker/shared";

export interface MessageStore {
  create(content: string): Promise<Message>;
  healthCheck(): Promise<void>;
  list(): Promise<Message[]>;
}

export class InMemoryMessageStore implements MessageStore {
  readonly #messages: Message[];

  constructor(initialMessages: Message[] = []) {
    this.#messages = [...initialMessages];
  }

  async create(content: string): Promise<Message> {
    const message: Message = {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
    };

    this.#messages.unshift(message);
    return message;
  }

  async healthCheck(): Promise<void> {}

  async list(): Promise<Message[]> {
    return [...this.#messages];
  }
}
