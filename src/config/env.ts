import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DB_URL: z
    .string()
    .min(1, "DB_URL is required")
    .default("postgres://localhost/mcp_memory"),
  API_KEY: z.string().optional(),
  EMBED_PROVIDER: z.enum(["openai", "local"]).default("openai"),
  EMBED_MODEL: z.string().default("text-embedding-3-small"),
  DATA_ROOT: z.string().default(".mcp-memory"),
  PORT: z
    .preprocess((value) => (value === undefined ? undefined : Number(value)), z.number().int().positive())
    .default(8080),
  HOST: z.string().default("0.0.0.0"),
  SEARCH_ALPHA: z
    .preprocess((value) => (value === undefined ? undefined : Number(value)), z.number().min(0).max(1))
    .default(0.6),
  RESULTS_TOPK: z
    .preprocess((value) => (value === undefined ? undefined : Number(value)), z.number().int().positive())
    .default(8),
  CHUNK_TOKENS: z
    .preprocess((value) => (value === undefined ? undefined : Number(value)), z.number().int().positive())
    .default(900),
  CHUNK_OVERLAP: z
    .preprocess((value) => (value === undefined ? undefined : Number(value)), z.number().int().nonnegative())
    .default(150),
  RATE_LIMIT_MAX: z
    .preprocess((value) => (value === undefined ? undefined : Number(value)), z.number().int().positive())
    .default(60),
  RATE_LIMIT_WINDOW: z.string().default("1 minute"),
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DB_URL: process.env.DB_URL,
  API_KEY: process.env.API_KEY,
  EMBED_PROVIDER: process.env.EMBED_PROVIDER,
  EMBED_MODEL: process.env.EMBED_MODEL,
  DATA_ROOT: process.env.DATA_ROOT,
  PORT: process.env.PORT ?? process.env.HTTP_PORT,
  HOST: process.env.HOST,
  SEARCH_ALPHA: process.env.SEARCH_ALPHA,
  RESULTS_TOPK: process.env.RESULTS_TOPK,
  CHUNK_TOKENS: process.env.CHUNK_TOKENS,
  CHUNK_OVERLAP: process.env.CHUNK_OVERLAP,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
});

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

export const env = parsed.data;
