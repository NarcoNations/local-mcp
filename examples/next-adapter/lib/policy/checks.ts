import { sbAdmin } from '@/examples/next-adapter/lib/supabase/admin';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export type PolicyResult = {
  action: string;
  scope: string;
  passed: boolean;
  reasons: string[];
  meta?: Record<string, any>;
};

const BLOCKLIST = [/illegal/i, /explosive/i, /harm/i];
const BRAND_GUARDRAILS = [/off-brand/i, /malware/i];

export async function runPolicyChecks(action: string, content: string, meta: Record<string, any> = {}): Promise<PolicyResult> {
  const reasons: string[] = [];
  const lower = content.toLowerCase();
  for (const regex of BLOCKLIST) {
    if (regex.test(lower)) reasons.push(`Content flagged by safety rule: ${regex}`);
  }
  for (const regex of BRAND_GUARDRAILS) {
    if (regex.test(lower)) reasons.push(`Brand guardrail triggered: ${regex}`);
  }
  if (meta.crisis === true) {
    reasons.push('Crisis messaging injector requires manual approval');
  }

  const passed = reasons.length === 0;
  const result: PolicyResult = {
    action,
    scope: meta.scope || 'publish',
    passed,
    reasons,
    meta,
  };

  await sbAdmin()
    .from('policy_checks')
    .insert({
      action,
      scope: result.scope,
      content_preview: content.slice(0, 280),
      passed,
      reasons,
      meta,
      created_at: new Date().toISOString(),
    });

  await logEvent({
    source: 'policy',
    kind: passed ? 'policy.pass' : 'policy.fail',
    title: `${action} ${passed ? 'approved' : 'blocked'}`,
    meta: { reasons, action, scope: result.scope },
  });

  return result;
}

export async function shadowSelfSummary(action: string, content: string) {
  const counter = `Shadow self response for ${action}: consider ethical, legal, brand, and societal risks before proceeding.`;
  await logEvent({
    source: 'policy.shadow',
    kind: 'policy.shadow.summary',
    title: `Shadow summary for ${action}`,
    body: counter,
    meta: { action, preview: content.slice(0, 140) },
  });
  return counter;
}
