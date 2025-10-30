import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';

function safeSupabase() {
  try {
    return sbServer();
  } catch (_) {
    return null;
  }
}

export type PolicyInput = {
  action: string;
  content: string;
  meta?: Record<string, any>;
};

export type PolicyDecision = {
  passed: boolean;
  reasons: string[];
  shadowSelf?: string;
};

const CONTENT_BLOCKLIST = [
  // EDIT HERE: tune brand, ethics, and crisis language filters
  /explosives?/i,
  /money\s+laundering/i,
  /harmful\s+directive/i,
];

const BRAND_WARNINGS = [
  // EDIT HERE: extend with approved messaging guardrails
  'NarcoNations',
  'VibeOS',
];

export async function runPolicyChecks(input: PolicyInput): Promise<PolicyDecision> {
  const reasons: string[] = [];
  if (!input.content || input.content.trim().length === 0) {
    reasons.push('Empty content');
  }
  if (CONTENT_BLOCKLIST.some((rule) => rule.test(input.content))) {
    reasons.push('Content violates safety filter');
  }
  if (input.action.startsWith('publish:') || input.action.startsWith('social:')) {
    const mentions = BRAND_WARNINGS.filter((keyword) => input.content.includes(keyword));
    if (mentions.length > 2) {
      reasons.push('Brand keyword density unusually high');
    }
  }

  const passed = reasons.length === 0;
  const shadowSelf = `Shadow Self Review → Potential risks for ${input.action}: ${
    reasons.length ? reasons.join('; ') : 'No material risk detected.'
  }`;

  try {
    const sb = safeSupabase();
    if (sb) {
      await sb.from('policy_checks').insert({
        ts: new Date().toISOString(),
        action: input.action,
        content: input.content,
        meta: input.meta ?? {},
        passed,
        reasons,
        shadow_self: shadowSelf,
      });
    }
  } catch (_) {
    // swallow supabase errors when table not ready
  }

  await logEvent({
    source: 'policy',
    kind: passed ? 'policy.pass' : 'policy.fail',
    title: `${input.action} ${passed ? 'approved' : 'blocked'}`,
    body: shadowSelf,
    meta: { reasons },
  });

  return { passed, reasons, shadowSelf };
}
