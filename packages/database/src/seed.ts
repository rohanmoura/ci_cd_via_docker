import { createDatabase } from "./client";
import { messages } from "./schema";

const connectionString =
  Bun.env.DATABASE_URL ?? "postgresql://app:app@localhost:5432/app";
const database = createDatabase(connectionString);

try {
  await database.db
    .insert(messages)
    .values({
      id: "00000000-0000-4000-8000-000000000001",
      content: "Welcome! This message is stored in PostgreSQL.",
    })
    .onConflictDoNothing({ target: messages.id });

  console.log("Database seed completed.");
} finally {
  await database.close();
}
