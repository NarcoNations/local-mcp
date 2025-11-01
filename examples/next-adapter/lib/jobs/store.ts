import crypto from 'node:crypto';
import { sbServer } from '@/lib/supabase/server';

type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

type JobRecord = {
  id: string;
  kind: string;
  payload: unknown;
  status: JobStatus;
  result?: unknown;
  error?: string | null;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
};

type JobStore = Map<string, JobRecord>;

function getStore(): JobStore {
  const globalAny = globalThis as any;
  if (!globalAny.__vibeos_jobs) {
    globalAny.__vibeos_jobs = new Map();
  }
  return globalAny.__vibeos_jobs as JobStore;
}

export async function createJob(kind: string, payload: unknown) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const record: JobRecord = { id, kind, payload, status: 'queued', createdAt };
  getStore().set(id, record);
  await persistJob(record);
  return record;
}

export function getJob(id: string) {
  return getStore().get(id) || null;
}

export async function updateJob(id: string, updates: Partial<JobRecord>) {
  const store = getStore();
  const existing = store.get(id);
  if (!existing) return null;
  const next = { ...existing, ...updates } as JobRecord;
  store.set(id, next);
  await persistJob(next);
  return next;
}

async function persistJob(record: JobRecord) {
  try {
    const sb = safeSupabase();
    if (!sb) return;
    await sb.from('jobs').upsert({
      id: record.id,
      kind: record.kind,
      payload: record.payload,
      status: record.status,
      result: record.result ?? null,
      error: record.error ?? null,
      created_at: record.createdAt,
      started_at: record.startedAt ?? null,
      finished_at: record.finishedAt ?? null
    });
  } catch (err) {
    console.warn('persistJob', err);
  }
}

function safeSupabase() {
  try {
    return sbServer();
  } catch (err) {
    return null;
  }
}
