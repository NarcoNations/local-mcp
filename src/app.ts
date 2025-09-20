import { loadConfig } from "./config.js";
import { AppConfig } from "./types.js";
import { Store } from "./store/store.js";
import { Embedder, getEmbedder } from "./pipeline/embed.js";

export interface AppContext {
  config: AppConfig;
  store: Store;
  embedder: Embedder;
}

let contextPromise: Promise<AppContext> | null = null;

export async function getAppContext(): Promise<AppContext> {
  if (!contextPromise) {
    contextPromise = (async () => {
      const config = await loadConfig();
      const store = await Store.load(config);
      const embedder = getEmbedder(config);
      return { config, store, embedder };
    })();
  }
  return contextPromise;
}
