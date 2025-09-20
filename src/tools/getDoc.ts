import { z } from "zod";
import { AppConfig } from "../config.js";
import { getStore } from "../store/store.js";
import { ensureWithinRoots } from "../utils/fs-guard.js";

export const GetDocShape = {
  path: z.string().min(1),
  page: z.number().int().min(1).optional(),
};

export const GetDocInputSchema = z.object(GetDocShape);

export function createGetDocTool(config: AppConfig) {
  return async function getDoc(input: unknown) {
    const parsed = GetDocInputSchema.parse(input);
    const absPath = await ensureWithinRoots(config.roots.roots, parsed.path);
    const store = await getStore(config);
    const chunks = store
      .listChunks()
      .filter((chunk) => chunk.path === absPath && (parsed.page ? chunk.page === parsed.page : true));

    if (chunks.length === 0) {
      return { path: absPath, page: parsed.page, text: "" };
    }

    const text = chunks.map((chunk) => chunk.text).join("\n\n");
    return { path: absPath, page: parsed.page, text };
  };
}
