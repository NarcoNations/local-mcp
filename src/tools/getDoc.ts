import path from "path";
import { z } from "zod";
import { Store } from "../store/store.js";
import { FSGuard } from "../utils/fs-guard.js";
import { indexFile } from "../indexers/index.js";

const InputSchema = z.object({
  path: z.string().min(1),
  page: z.number().min(1).optional()
});

export function createGetDocTool(store: Store) {
  return {
    name: "get_doc",
    description: "Return the text of a document (optionally a specific page).",
    inputSchema: InputSchema,
    jsonSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        page: { type: "integer", minimum: 1 }
      },
      required: ["path"],
      additionalProperties: false
    },
    handler: async (raw: unknown) => {
      const input = InputSchema.parse(raw);
      const guard = await FSGuard.create(store.getConfig().roots);
      const resolved = await guard.resolvePath(input.path, { mustExist: true });
      const relative = path.relative(process.cwd(), resolved);
      let chunks = store.getChunksByPath(relative, input.page);
      if (!chunks.length) {
        const indexed = await indexFile(relative, store.getConfig());
        chunks = indexed.chunks.filter((chunk) => (input.page ? chunk.page === input.page : true));
      }
      const text = chunks.map((chunk) => chunk.text).join("\n\n");
      return {
        path: relative,
        page: input.page,
        text
      };
    }
  };
}
