import { AppContext } from "../app.js";

export async function stats(context: AppContext) {
  const { store } = context;
  const files = store.listFiles();
  return {
    files: files.length,
    chunks: store.getChunkCount(),
    byType: store.getChunksByType(),
    embeddingsCached: store.getVectorCount(),
    lastIndexedAt: store.getLastUpdated(),
  };
}
