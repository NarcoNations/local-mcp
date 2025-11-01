import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export type PolicyScope = 'publish:*' | 'social:*' | 'map:*' | 'general';

export type PolicyPayload = {
  scope: PolicyScope;
  action: string;
  content: string;
  meta?: Record<string, any>;
};

export type PolicyResult = {
  passed: boolean;
  reasons: string[];
  shadowSelf: string;
};

const BANNED_KEYWORDS = [
  /illegal/i,
  /weapons?/i,
  /explosive/i,
];

const BRAND_WARNINGS = [/off-brand/i, /counterfeit/i];

export async function runPolicyChecks(payload: PolicyPayload): Promise<PolicyResult> {
  const reasons: string[] = [];

  for (const rule of BANNED_KEYWORDS) {
    if (rule.test(payload.content)) {
      reasons.push('Content includes restricted instructions');
      break;
    }
  }
  if (payload.scope === 'publish:*' || payload.scope === 'social:*') {
    for (const rule of BRAND_WARNINGS) {
      if (rule.test(payload.content)) {
        reasons.push('Brand guideline warning triggered');
        break;
      }
    }
  }

  if ((payload.meta?.crisis ?? false) === true) {
    reasons.push('Crisis messaging requires manual approval');
  }

  const passed = reasons.length === 0;
  const shadowSelf = buildShadowSelf(payload);

  await persistPolicyResult(payload, { passed, reasons, shadowSelf });

  return { passed, reasons, shadowSelf };
}

function buildShadowSelf(payload: PolicyPayload) {
  const riskNotes: string[] = [];
  if (payload.scope === 'publish:*') {
    riskNotes.push('Ensure publishing aligns with community safety guidelines.');
  }
  if (payload.scope === 'social:*') {
    riskNotes.push('Consider tone, platform rules, and cultural sensitivity.');
  }
  if (/crisis/i.test(payload.content)) {
    riskNotes.push('Escalate to crisis communications contact for review.');
  }
  return riskNotes.join(' ');
}

async function persistPolicyResult(payload: PolicyPayload, result: PolicyResult) {
  try {
    const sb = sbServer();
    await sb.from('policy_gate_logs').insert({
      scope: payload.scope,
      action: payload.action,
      status: result.passed ? 'pass' : 'fail',
      reasons: result.reasons,
      payload: { ...(payload.meta ?? {}), content: payload.content },
    });
    await logEvent({
      source: 'policy',
      kind: result.passed ? 'policy.pass' : 'policy.fail',
      title: `${payload.action} → ${result.passed ? 'approved' : 'blocked'}`,
      body: result.shadowSelf,
      meta: { reasons: result.reasons },
    });
  } catch (err) {
    console.error('[policy] failed to persist result', err);
  }
}
