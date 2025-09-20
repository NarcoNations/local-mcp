import { z } from "zod";
import { AppContext } from "../app.js";

const InputSchema = z.object({
  path: z.string().min(1),
  page: z.number().int().min(1).optional(),
});

export async function getDoc(context: AppContext, input: unknown) {
  const { store } = context;
  const { path: filePath, page } = InputSchema.parse(input ?? {});
  const record = store.getFileRecord(filePath);
  if (!record) {
    throw new Error(`File not indexed: ${filePath}`);
  }
  const chunks = store.getChunks(record.chunkIds);
  const filtered = page ? chunks.filter((chunk) => chunk.page === page) : chunks;
  const text = filtered.map((chunk) => chunk.text).join("\n\n");
  return {
    path: filePath,
    page,
    text,
  };
}
