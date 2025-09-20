import { getStats } from "../store/store.js";

export async function statsTool() {
  return getStats();
}
