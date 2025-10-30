import { USE_MOCKS } from "../config/env";
import { mockKnowledgeEntries } from "../mocks/dashboard";
import type { KnowledgeEntry } from "../types/app";

const KNOWLEDGE_API = "/api/knowledge";

export async function listKnowledge(): Promise<KnowledgeEntry[]> {
  if (USE_MOCKS) {
    return mockKnowledgeEntries;
  }
  try {
    const response = await fetch(`${KNOWLEDGE_API}/list`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch knowledge");
    const data = (await response.json()) as KnowledgeEntry[];
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return mockKnowledgeEntries;
  } catch (error) {
    console.warn("knowledge:list fallback", error);
    return mockKnowledgeEntries;
  }
}

export async function indexKnowledge(slug: string) {
  if (USE_MOCKS) {
    return { ok: true };
  }
  try {
    const response = await fetch(`${KNOWLEDGE_API}/index`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    return { ok: response.ok };
  } catch (error) {
    console.warn("knowledge:index fallback", error);
    return { ok: false };
  }
}
