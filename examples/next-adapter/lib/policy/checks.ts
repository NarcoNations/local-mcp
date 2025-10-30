import { logEvent } from '@/examples/next-adapter/lib/historian';
import { mockPolicyEvents } from '@/examples/next-adapter/lib/mocks/m3';
import { createClient } from '@supabase/supabase-js';

export type PolicyInput = {
  content: string;
  scope: string;
  actor: string;
};

export type PolicyDecision = {
  id: string;
  status: 'pass' | 'fail';
  reasons: string[];
  shadow_self?: string;
  created_at: string;
};

const BANNED_KEYWORDS = [/illegal/i, /cartel/i]; // EDIT HERE

function supabaseService() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function evaluatePolicy(input: PolicyInput): Promise<PolicyDecision> {
  const reasons: string[] = [];
  for (const keyword of BANNED_KEYWORDS) {
    if (keyword.test(input.content)) {
      reasons.push(`Contains banned keyword: ${keyword}`);
    }
  }
  if (/panic/i.test(input.content)) {
    reasons.push('Crisis messaging requires calm counter-narrative.');
  }
  const status: 'pass' | 'fail' = reasons.length === 0 ? 'pass' : 'fail';
  const shadowSelf = `Shadow self counters: Assess risk of ${input.scope}. Suggest mitigation.`;
  const decision: PolicyDecision = {
    id: crypto.randomUUID(),
    status,
    reasons,
    shadow_self: shadowSelf,
    created_at: new Date().toISOString(),
  };
  const sb = supabaseService();
  if (sb) {
    await sb.from('policy_checks').insert({
      id: decision.id,
      content: input.content,
      scope: input.scope,
      status,
      reasons,
      shadow_self: shadowSelf,
      actor: input.actor,
      created_at: decision.created_at,
    });
  }
  await logEvent({
    source: 'policy',
    kind: `policy.${status}`,
    title: `${status.toUpperCase()} :: ${input.scope}`,
    meta: { reasons, actor: input.actor }
  });
  return decision;
}

export async function latestPolicyDecisions(limit = 20): Promise<PolicyDecision[]> {
  if (process.env.USE_MOCKS === 'true') {
    return mockPolicyEvents.map((event) => ({
      id: event.id,
      status: event.status as 'pass' | 'fail',
      reasons: [event.reason],
      created_at: event.created_at,
    }));
  }
  const sb = supabaseService();
  if (!sb) return [];
  const { data } = await sb
    .from('policy_checks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    status: row.status,
    reasons: row.reasons ?? [],
    shadow_self: row.shadow_self,
    created_at: row.created_at,
  }));
}
