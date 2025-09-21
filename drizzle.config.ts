import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

loadEnv();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DB_URL ?? "postgres://localhost/mcp_memory",
  },
  strict: true,
});
