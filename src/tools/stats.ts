import { ResearchStore } from "../store/store.js";

export async function handleStats(store: ResearchStore) {
  const stats = await store.stats();
  return stats;
}

export const statsSpec = {
  name: "stats",
  description: "Return summary statistics about the index.",
};
