import { z } from "zod";

export const ManifestEntrySchema = z.object({
  path: z.string(),
  chunks: z.array(z.string()),
  mtime: z.number(),
  hash: z.string(),
  type: z.enum(["pdf", "markdown", "text", "word", "pages"]),
  partial: z.boolean().optional(),
});

export const ManifestSchema = z.object({
  files: z.record(z.string(), ManifestEntrySchema),
  chunks: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
