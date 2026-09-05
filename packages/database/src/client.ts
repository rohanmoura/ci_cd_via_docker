import { drizzle } from "drizzle-orm/bun-sql";

import * as schema from "./schema";

export function createDatabase(connectionString: string) {
  if (!connectionString) {
    throw new Error("A PostgreSQL connection string is required.");
  }

  const db = drizzle(connectionString, { schema });

  return {
    db,
    close: () => db.$client.close(),
  };
}

export type Database = ReturnType<typeof createDatabase>["db"];
