import { z } from "zod";
import { AppConfig } from "../config.js";
import { getStore } from "../store/store.js";

export const ReindexShape = {
  paths: z.array(z.string()).default([]),
};

export const ReindexInputSchema = z.object(ReindexShape);

export function createReindexTool(config: AppConfig) {
  return async function reindex(input: unknown) {
    const parsed = ReindexInputSchema.parse(input ?? {});
    const store = await getStore(config);
    const stats = await store.reindex(parsed.paths);
    return { indexed: stats.indexed, updated: stats.updated, skipped: stats.skipped };
  };
}
