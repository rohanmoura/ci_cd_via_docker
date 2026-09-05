import { messages, type Database } from "@ci-cd-via-docker/database";
import type { Message } from "@ci-cd-via-docker/shared";
import { desc, sql } from "drizzle-orm";

import type { MessageStore } from "./message-store";

export class PostgresMessageStore implements MessageStore {
  constructor(private readonly db: Database) {}

  async create(content: string): Promise<Message> {
    const [message] = await this.db
      .insert(messages)
      .values({ content })
      .returning();

    if (!message) throw new Error("PostgreSQL did not return the new message.");
    return message;
  }

  async healthCheck(): Promise<void> {
    await this.db.execute(sql`select 1`);
  }

  async list(): Promise<Message[]> {
    return this.db.select().from(messages).orderBy(desc(messages.createdAt));
  }
}
