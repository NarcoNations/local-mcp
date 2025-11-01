import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { logger } from "../utils/logger.js";

const feedRequestSchema = z.object({
  fn: z.enum(["TIME_SERIES_DAILY", "OVERVIEW"]),
  symbol: z
    .string()
    .min(1, "symbol required")
    .max(16, "symbol too long")
    .transform((value) => value.trim().toUpperCase()),
});

const llmRequestSchema = z.object({
  task: z.enum(["summarize", "draft_copy", "classify"]),
  prompt: z.string().min(1, "prompt required"),
  modelHint: z.string().optional(),
});

type FeedCacheEntry = { data: unknown; status: number; expiresAt: number };

const feedCache = new Map<string, FeedCacheEntry>();
const feedTtlSeconds = Number(process.env.API_CACHE_TTL_SECONDS ?? "60");

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(url, key, { auth: { persistSession: false } });
  }
  return supabaseClient;
}

function hashPrompt(prompt: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(prompt);
  return hash.digest("hex");
}

export async function runAlphaFeed(raw: unknown) {
  const parsed = feedRequestSchema.parse(raw);
  const cacheKey = `${parsed.fn}:${parsed.symbol}`;
  const now = Date.now();
  const ttlSeconds = Math.max(feedTtlSeconds, 15);
  const cached = feedCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return { cached: true, status: cached.status, data: cached.data };
  }

  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  if (!apiKey) {
    throw new Error("ALPHA_VANTAGE_KEY not set");
  }

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", parsed.fn);
  url.searchParams.set("symbol", parsed.symbol);
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url, { headers: { "User-Agent": "local-mcp-api-manager" } });
  const status = res.status;
  const payload = await res.json();
  if (!res.ok) {
    await persistFeedCache(cacheKey, parsed.fn, parsed.symbol, status, payload, now, ttlSeconds);
    throw new Error(payload?.Note || payload?.ErrorMessage || `Feed request failed (${status})`);
  }

  const entry: FeedCacheEntry = {
    data: payload,
    status,
    expiresAt: now + ttlSeconds * 1000,
  };
  feedCache.set(cacheKey, entry);
  await persistFeedCache(cacheKey, parsed.fn, parsed.symbol, status, payload, now + ttlSeconds * 1000, ttlSeconds);
  return { cached: false, status, data: payload };
}

export async function runLlmRouter(raw: unknown) {
  const parsed = llmRequestSchema.parse(raw);
  const hint = (parsed.modelHint || "").toLowerCase();
  if (hint.includes("local")) {
    const output = `[LOCAL] ${parsed.task}: ${parsed.prompt.slice(0, 240)}${parsed.prompt.length > 240 ? "…" : ""}`;
    await persistPromptRun({
      task: parsed.task,
      prompt: parsed.prompt,
      model: "local:mock",
      modelHint: parsed.modelHint,
      ok: true,
      latencyMs: 0,
      outputPreview: output,
    });
    return { model: "local:mock", output };
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY not set");
  }
  const body = {
    model: process.env.OPENAI_MODEL_HINT || "gpt-4o-mini",
    messages: [{ role: "user", content: `${parsed.task}: ${parsed.prompt}` }],
    temperature: 0.7,
  };
  const started = Date.now();
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const latency = Date.now() - started;
  if (!res.ok) {
    const text = await res.text();
    await persistPromptRun({
      task: parsed.task,
      prompt: parsed.prompt,
      model: body.model,
      modelHint: parsed.modelHint,
      ok: false,
      latencyMs: latency,
      outputPreview: text.slice(0, 512),
    });
    throw new Error(`OpenAI request failed (${res.status})`);
  }
  const json = await res.json();
  const output = json.choices?.[0]?.message?.content || "";
  await persistPromptRun({
    task: parsed.task,
    prompt: parsed.prompt,
    model: body.model,
    modelHint: parsed.modelHint,
    ok: true,
    latencyMs: latency,
    outputPreview: output.slice(0, 512),
  });
  return { model: body.model, output, latencyMs: latency };
}

async function persistFeedCache(
  cacheKey: string,
  fn: string,
  symbol: string,
  status: number,
  payload: unknown,
  expiresAtMs: number,
  ttlSeconds: number
) {
  try {
    const client = getSupabase();
    if (!client) return;
    const expiresAt = new Date(expiresAtMs).toISOString();
    await client.from("api_cache").upsert(
      {
        provider: "alpha_vantage",
        cache_key: cacheKey,
        status,
        payload,
        ttl_seconds: ttlSeconds,
        cached_at: new Date().toISOString(),
        expires_at: expiresAt,
        meta: { fn, symbol },
      },
      { onConflict: "provider,cache_key" }
    );
  } catch (error) {
    logger.debug("supabase-cache-upsert-failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function persistPromptRun(run: {
  task: string;
  prompt: string;
  model: string;
  modelHint?: string;
  ok: boolean;
  latencyMs: number;
  outputPreview: string;
}) {
  try {
    const client = getSupabase();
    if (!client) return;
    await client.from("prompt_runs").insert({
      task: run.task,
      prompt_hash: hashPrompt(run.prompt),
      prompt: run.prompt,
      model: run.model,
      model_hint: run.modelHint,
      latency_ms: run.latencyMs,
      ok: run.ok,
      output_preview: run.outputPreview,
    });
  } catch (error) {
    logger.debug("supabase-prompt-run-failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export type FeedResponse = Awaited<ReturnType<typeof runAlphaFeed>>;
export type LlmResponse = Awaited<ReturnType<typeof runLlmRouter>>;
