import type { ZodRawShape } from "zod";
import { z } from "zod";

const searchLocalShape = {
  query: z.string().min(1),
  k: z.number().int().min(1).max(50).default(8),
  alpha: z.number().min(0).max(1).default(0.65),
  filters: z
    .object({
      type: z.array(z.enum(["pdf", "markdown", "text", "word", "pages"])).optional(),
    })
    .partial()
    .optional(),
};

const getDocShape = {
  path: z.string().min(1),
  page: z.number().int().min(1).optional(),
};

const reindexShape = {
  paths: z.array(z.string().min(1)).optional(),
};

const watchShape = {
  paths: z.array(z.string().min(1)).optional(),
};

const importChatGPTShape = {
  exportPath: z.string().min(1),
  outDir: z.string().min(1).default("./docs/chatgpt-export-md"),
};

export const SearchLocalInput = z.object(searchLocalShape);
export const GetDocInput = z.object(getDocShape);
export const ReindexInput = z.object(reindexShape);
export const WatchInput = z.object(watchShape);
export const ImportChatGPTInput = z.object(importChatGPTShape);

export const SearchLocalShape: ZodRawShape = searchLocalShape;
export const GetDocShape: ZodRawShape = getDocShape;
export const ReindexShape: ZodRawShape = reindexShape;
export const WatchShape: ZodRawShape = watchShape;
export const ImportChatGPTShape: ZodRawShape = importChatGPTShape;

export const StatsOutput = z.object({
  files: z.number(),
  chunks: z.number(),
  byType: z.record(z.string(), z.number()),
  avgChunkLen: z.number(),
  embeddingsCached: z.number(),
  lastIndexedAt: z.number().optional(),
});
