import { DashboardData } from '../types/dashboard';
import { TimelineEvent, SearchResult, KnowledgeRecord, ApiProbeResult, WorkroomLane, PromptDefinition, ResearchResult, MvpResult } from '../types/systems';
import { mockDashboardData } from '../mocks/dashboard';
import { mockTimelineEvents } from '../mocks/timeline';
import { mockSearchResults } from '../mocks/search';
import { mockKnowledgeRecords } from '../mocks/knowledge';
import { mockApiResults } from '../mocks/apiManager';
import { mockWorkroomLanes } from '../mocks/workroom';
import { mockPrompts } from '../mocks/prompts';
import { mockResearchResult } from '../mocks/research';
import { mockMvpResult } from '../mocks/mvp';
import { USE_MOCKS, getBaseUrl } from './env';

async function safeFetch<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${getBaseUrl()}${path}`, { cache: 'no-store', ...init });
    if (!response.ok) {
      return fallback;
    }
    const json = (await response.json()) as T;
    return json;
  } catch (error) {
    console.warn(`[api] falling back to mocks for ${path}`, error);
    return fallback;
  }
}

async function safePost<T>(path: string, body: BodyInit, fallback: T): Promise<T> {
  return safeFetch<T>(path, fallback, {
    method: 'POST',
    body,
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  if (USE_MOCKS) {
    return mockDashboardData;
  }
  return safeFetch<DashboardData>('/api/dashboard', mockDashboardData);
}

export async function getTimelineEvents(page = 1): Promise<TimelineEvent[]> {
  if (USE_MOCKS) {
    return mockTimelineEvents.slice((page - 1) * 6, page * 6);
  }
  return safeFetch<TimelineEvent[]>(`/api/timeline?page=${page}`, mockTimelineEvents);
}

export async function getKnowledgeRecords(): Promise<KnowledgeRecord[]> {
  if (USE_MOCKS) {
    return mockKnowledgeRecords;
  }
  return safeFetch<KnowledgeRecord[]>('/api/knowledge', mockKnowledgeRecords);
}

export async function getSearchResults(query: string): Promise<SearchResult[]> {
  if (!query) return [];
  if (USE_MOCKS) {
    const normalized = query.toLowerCase();
    return mockSearchResults.filter((item) =>
      item.title.toLowerCase().includes(normalized) ||
      item.snippet.toLowerCase().includes(normalized) ||
      item.source.toLowerCase().includes(normalized),
    );
  }
  return safeFetch<SearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`, []);
}

export async function submitAlphaProbe(input: { symbol: string; fn: string }): Promise<ApiProbeResult> {
  if (USE_MOCKS) {
    const result: ApiProbeResult = {
      id: `probe-${Date.now()}`,
      type: 'alpha',
      request: input,
      response: 'Alpha probe accepted. Awaiting downstream execution logs.',
      createdAt: new Date().toISOString(),
    };
    mockApiResults.unshift(result);
    return result;
  }
  return safePost<ApiProbeResult>('/api/api-manager/alpha', JSON.stringify(input), {
    id: 'probe-local',
    type: 'alpha',
    request: input,
    response: 'Probe acknowledged.',
    createdAt: new Date().toISOString(),
  });
}

export async function submitLlmProbe(input: { task: string; prompt: string }): Promise<ApiProbeResult> {
  if (USE_MOCKS) {
    const result: ApiProbeResult = {
      id: `probe-${Date.now()}`,
      type: 'llm',
      request: input,
      response: 'LLM probe queued. Check historian for completion notice.',
      createdAt: new Date().toISOString(),
    };
    mockApiResults.unshift(result);
    return result;
  }
  return safePost<ApiProbeResult>('/api/api-manager/llm', JSON.stringify(input), {
    id: 'probe-local',
    type: 'llm',
    request: input,
    response: 'Probe acknowledged.',
    createdAt: new Date().toISOString(),
  });
}

export async function getApiProbeResults(): Promise<ApiProbeResult[]> {
  if (USE_MOCKS) {
    return mockApiResults;
  }
  return safeFetch<ApiProbeResult[]>('/api/api-manager/results', mockApiResults);
}

export async function submitIngestConversion(formData: FormData): Promise<{ id: string }> {
  if (USE_MOCKS) {
    return { id: `ing-${Date.now()}` };
  }
  return safeFetch<{ id: string }>('/api/ingest/convert', { id: 'ing-local' }, {
    method: 'POST',
    body: formData,
  });
}

export async function submitCorpusUrl(payload: { url: string }): Promise<{ id: string }> {
  if (USE_MOCKS) {
    return { id: `corpus-${Date.now()}` };
  }
  return safePost<{ id: string }>('/api/ingest/chatgpt', JSON.stringify(payload), { id: 'corpus-local' });
}

export async function indexKnowledgeRecord(id: string): Promise<{ status: string }> {
  if (USE_MOCKS) {
    return { status: 'queued' };
  }
  return safePost<{ status: string }>(`/api/knowledge/index`, JSON.stringify({ id }), { status: 'queued' });
}

export async function getWorkroomLanes(): Promise<WorkroomLane[]> {
  if (USE_MOCKS) {
    return mockWorkroomLanes;
  }
  return safeFetch<WorkroomLane[]>('/api/workroom', mockWorkroomLanes);
}

export async function getPromptLibrary(): Promise<PromptDefinition[]> {
  if (USE_MOCKS) {
    return mockPrompts;
  }
  return safeFetch<PromptDefinition[]>('/api/prompts', mockPrompts);
}

export async function runPrompt(id: string): Promise<{ output: string }> {
  if (USE_MOCKS) {
    const prompt = mockPrompts.find((item) => item.id === id);
    return { output: prompt ? prompt.body : 'Prompt executed.' };
  }
  return safePost<{ output: string }>(`/api/prompts/${id}/run`, JSON.stringify({ id }), { output: 'Prompt executed.' });
}

export async function requestResearch(payload: { query: string; objectives: string }): Promise<ResearchResult> {
  if (USE_MOCKS) {
    return { ...mockResearchResult, query: payload.query };
  }
  return safePost<ResearchResult>('/api/research', JSON.stringify(payload), mockResearchResult);
}

export async function generateMvp(payload: { brief: string }): Promise<MvpResult> {
  if (USE_MOCKS) {
    return { ...mockMvpResult, summary: mockMvpResult.summary + ' — Drafted from brief.' };
  }
  return safePost<MvpResult>('/api/mvp/generate', JSON.stringify(payload), mockMvpResult);
}

export async function enqueueSocialJob(payload: { template: string; topic: string }): Promise<{ status: string }> {
  if (USE_MOCKS) {
    return { status: 'queued' };
  }
  return safePost<{ status: string }>('/api/social/enqueue', JSON.stringify(payload), { status: 'queued' });
}
