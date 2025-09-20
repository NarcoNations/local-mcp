import { z } from "zod";
import { Store, reindexPaths } from "../store/store.js";

const InputSchema = z.object({
  paths: z.array(z.string().min(1)).default([])
});

export function createReindexTool(store: Store) {
  return {
    name: "reindex",
    description: "Reindex files or directories under the configured roots.",
    inputSchema: InputSchema,
    jsonSchema: {
      type: "object",
      properties: {
        paths: {
          type: "array",
          items: { type: "string" },
          default: []
        }
      },
      additionalProperties: false
    },
    handler: async (raw: unknown) => {
      const input = InputSchema.parse(raw ?? {});
      const result = await reindexPaths(store, input.paths);
      return {
        indexed: result.indexed,
        updated: result.updated,
        skipped: result.skipped
      };
    }
  };
}
