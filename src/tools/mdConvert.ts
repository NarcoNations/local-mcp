import { z } from "zod";
import { AppConfig } from "../config.js";
import { convertWithMdWorker, MdConvertOrigin } from "../ingest/mdConvert.js";

export const MdConvertShape = {
  path: z.string().min(1),
  tags: z.array(z.string().min(1)).optional(),
  origin: z.enum(["upload", "email", "url", "drop"]).optional(),
  outDir: z.string().min(1).optional(),
  reindex: z.boolean().optional(),
};

export const MdConvertSchema = z.object(MdConvertShape);

export function createMdConvertTool(config: AppConfig) {
  return async function mdConvert(input: unknown) {
    const parsed = MdConvertSchema.parse(input);
    const result = await convertWithMdWorker(config, {
      path: parsed.path,
      tags: parsed.tags,
      origin: parsed.origin as MdConvertOrigin | undefined,
      outDir: parsed.outDir,
      reindex: parsed.reindex,
    });
    return result;
  };
}
