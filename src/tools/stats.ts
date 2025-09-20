import { AppConfig } from "../config.js";
import { getStore } from "../store/store.js";

export function createStatsTool(config: AppConfig) {
  return async function stats() {
    const store = await getStore(config);
    return store.getManifest();
  };
}
