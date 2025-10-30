import { USE_MOCKS } from "../config/env";
import { mockSearchResults } from "../mocks/dashboard";
import type { SearchResultItem } from "../types/app";

const SEARCH_API = "/api/search";

export async function runSearch(query: string): Promise<SearchResultItem[]> {
  if (!query) return [];
  if (USE_MOCKS) {
    const lowered = query.toLowerCase();
    return mockSearchResults.filter((result) =>
      result.title.toLowerCase().includes(lowered) ||
      result.snippet.toLowerCase().includes(lowered)
    );
  }
  try {
    const response = await fetch(`${SEARCH_API}?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Search failed");
    const data = (await response.json()) as SearchResultItem[];
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.warn("search fallback", error);
    return mockSearchResults;
  }
}
