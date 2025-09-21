import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../config/env";
import * as schema from "./schema";

const connection = postgres(env.DB_URL, {
  prepare: false,
  max: 10,
  idle_timeout: 5,
});

export const db = drizzle(connection, { schema });

export type Database = typeof db;

export async function closeDb(): Promise<void> {
  await connection.end({ timeout: 5 });
}

export { schema };
