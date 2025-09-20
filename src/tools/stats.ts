import { Store } from "../store/store.js";

export function createStatsTool(store: Store) {
  return {
    name: "stats",
    description: "Return index statistics.",
    inputSchema: null,
    jsonSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    },
    handler: async () => {
      return store.getStats();
    }
  };
}
