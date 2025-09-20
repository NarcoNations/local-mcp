import { z } from "zod";
import type { KnowledgeStore } from "../store/store.js";

const InputSchema = z.object({
  path: z.string().min(1),
  page: z.number().min(1).optional(),
});

export async function getDoc(store: KnowledgeStore, input: unknown, _context?: { emit: (event: unknown) => void }) {
  const parsed = InputSchema.parse(input);
  const doc = await store.getDocument(parsed.path, parsed.page);
  return {
    content: [
      {
        type: "text",
        text: doc.text,
      },
    ],
    structuredContent: doc,
  };
}

export const getDocSpec = {
  name: "get_doc",
  description: "Return the full text for a file or a single PDF/Pages page.",
  inputSchema: InputSchema,
  handler: getDoc,
};
