import type { ApiManager, LLMRunRequest } from "@vibelabz/api-manager";
import { z } from "zod";

export const LLMRunShape = {
  task: z.string().min(1, "task is required"),
  prompt: z.string().min(1, "prompt is required"),
  modelHint: z.string().optional(),
  model: z.string().optional(),
  providerId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  cacheKey: z.string().optional(),
  cacheTtlSeconds: z.number().int().positive().optional(),
  useCache: z.boolean().optional(),
  user: z.string().optional(),
};

export const LLMRunSchema = z.object(LLMRunShape);

export type LLMRunInput = z.infer<typeof LLMRunSchema>;

export function createRunLLMTool(apiManager: ApiManager) {
  return async (input: LLMRunInput): Promise<Awaited<ReturnType<ApiManager["runLLM"]>>> => {
    const payload = LLMRunSchema.parse(input) as LLMRunRequest;
    return apiManager.runLLM(payload);
  };
}
