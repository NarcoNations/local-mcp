import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { runLLM } from '@vibelabz/api-manager';
import { logEvent } from '@/examples/next-adapter/lib/historian';

const payloadSchema = z.object({
  query: z.string().min(3),
  objectives: z.array(z.string().min(1)).default([]),
  mode: z.enum(['academic', 'narrative']).default('academic'),
});

export async function POST(req: NextRequest) {
  const originCheck = enforceCors(req.headers.get('origin'));
  if (!originCheck.ok) {
    return NextResponse.json({ error: originCheck.error }, { status: originCheck.status });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.format() }, { status: 400 });
  }

  const { query, objectives, mode } = parsed.data;
  const started = Date.now();
  const plan = buildPlan(query, objectives, mode);

  const llmResult = await runLLM({
    task: 'research_plan',
    prompt: `${mode} research on ${query}. Objectives: ${objectives.join('; ') || 'General landscape review.'}`,
    modelHint: objectives.length ? undefined : 'local',
  });

  const insights = synthesiseInsights(llmResult.output, query, mode);
  const response = {
    plan,
    facts: insights.facts,
    insights: insights.insights,
    sources: buildSources(query, objectives),
  };

  await logEvent({
    source: 'research',
    kind: 'research.run',
    title: `${mode} research for ${query}`,
    meta: {
      objectives,
      latencyMs: Date.now() - started,
      tokensEstimated: llmResult.tokensEstimated,
    },
  });

  return NextResponse.json(response, { status: 200, headers: corsHeaders(originCheck.origin) });
}

function enforceCors(origin: string | null) {
  const allowlist = (process.env.API_ALLOW_ORIGINS || 'http://localhost:3000').split(',');
  if (!origin) return { ok: true, origin: allowlist[0] };
  if (allowlist.includes(origin)) {
    return { ok: true, origin };
  }
  return { ok: false, status: 403, error: 'Origin not allowed' } as const;
}

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-API-Key',
  };
}

export function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders(process.env.API_ALLOW_ORIGINS?.split(',')[0] ?? '*') });
}

function buildPlan(query: string, objectives: string[], mode: 'academic' | 'narrative') {
  const base = [
    { id: 'scope', title: 'Clarify scope', detail: `Define the boundaries of “${query}” and success criteria.` },
    {
      id: 'scan',
      title: 'Landscape scan',
      detail: `Collect ${mode === 'academic' ? 'peer-reviewed and quantitative' : 'cultural and story-led'} sources relevant to the query.`,
    },
    {
      id: 'synthesis',
      title: 'Synthesis',
      detail: 'Combine findings into concise facts and vibe-forward insights.',
    },
  ];
  const objectiveSteps = objectives.map((objective, index) => ({
    id: `objective-${index + 1}`,
    title: `Objective ${index + 1}`,
    detail: objective,
  }));
  return [...base.slice(0, 1), ...objectiveSteps, ...base.slice(1)];
}

function synthesiseInsights(output: string, query: string, mode: string) {
  const lines = output.split(/\n|\*/).map((line) => line.trim()).filter(Boolean);
  const insights = lines.slice(0, 3).map((line, idx) => ({
    id: `insight-${idx + 1}`,
    headline: line,
    impact: mode === 'academic' ? 'Evidence-backed leverage point' : 'Narrative hook',
  }));
  const facts = lines.slice(3, 8).map((line, idx) => ({
    id: `fact-${idx + 1}`,
    statement: line,
  }));
  if (!insights.length) {
    insights.push({
      id: 'insight-1',
      headline: `Key opportunities emerging from ${query}`,
      impact: 'High-level summary based on heuristics',
    });
  }
  if (!facts.length) {
    facts.push({ id: 'fact-1', statement: `No direct facts available yet for ${query}.` });
  }
  return { insights, facts };
}

function buildSources(query: string, objectives: string[]) {
  const base = [
    {
      title: 'VibeLabz Knowledge Graph',
      url: `https://narconations.local/knowledge?q=${encodeURIComponent(query)}`,
      confidence: 'internal',
    },
  ];
  return base.concat(
    objectives.map((objective, idx) => ({
      title: `Objective ${idx + 1} trace`,
      url: `https://search.narconations.local/?q=${encodeURIComponent(objective)}`,
      confidence: 'todo',
    }))
  );
}
