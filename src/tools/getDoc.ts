import { z } from "zod";
import { ResearchStore } from "../store/store.js";

const InputSchema = z.object({
  path: z.string().min(1),
  page: z.number().int().min(1).optional(),
});

export async function handleGetDoc(store: ResearchStore, input: unknown) {
  const parsed = InputSchema.parse(input);
  const doc = await store.getDocument(parsed.path, parsed.page);
  return doc;
}

export const getDocSpec = {
  name: "get_doc",
  description: "Return the full text for a file or a specific page.",
  inputSchema: InputSchema,
};
