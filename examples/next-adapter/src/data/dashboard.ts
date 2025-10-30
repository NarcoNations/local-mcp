import { USE_MOCKS } from "../config/env";
import {
  mockCorpusStats,
  mockHistorianEvents,
  mockIngestConversions,
  mockKnowledgeEntries,
} from "../mocks/dashboard";
import type {
  CorpusStats,
  HistorianEvent,
  IngestConversion,
  KnowledgeEntry,
} from "../types/app";

const DASHBOARD_BASE = "/api/dashboard";

async function safeFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (error) {
    console.warn("Dashboard fetch fallback", error);
    return null;
  }
}

export async function getHistorianEvents(limit = 10): Promise<HistorianEvent[]> {
  if (USE_MOCKS) {
    return mockHistorianEvents.slice(0, limit);
  }
  const data = await safeFetch<HistorianEvent[]>(`${DASHBOARD_BASE}/historian?limit=${limit}`);
  if (data && Array.isArray(data) && data.length > 0) {
    return data;
  }
  return mockHistorianEvents.slice(0, limit);
}

export async function getIngestConversions(limit = 5): Promise<IngestConversion[]> {
  if (USE_MOCKS) {
    return mockIngestConversions.slice(0, limit);
  }
  const data = await safeFetch<IngestConversion[]>(`${DASHBOARD_BASE}/ingest?limit=${limit}`);
  if (data && Array.isArray(data) && data.length > 0) {
    return data;
  }
  return mockIngestConversions.slice(0, limit);
}

export async function getCorpusStats(): Promise<CorpusStats> {
  if (USE_MOCKS) {
    return mockCorpusStats;
  }
  const data = await safeFetch<CorpusStats>(`${DASHBOARD_BASE}/corpus`);
  return data ?? mockCorpusStats;
}

export async function getKnowledgeEntries(limit = 5): Promise<KnowledgeEntry[]> {
  if (USE_MOCKS) {
    return mockKnowledgeEntries.slice(0, limit);
  }
  const data = await safeFetch<KnowledgeEntry[]>(`${DASHBOARD_BASE}/knowledge?limit=${limit}`);
  if (data && Array.isArray(data) && data.length > 0) {
    return data;
  }
  return mockKnowledgeEntries.slice(0, limit);
}
