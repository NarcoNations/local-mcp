import type { LLMRun } from '../../types';

export async function runLLM(run: LLMRun) {
  const hint = (run.modelHint || '').toLowerCase();
  if (hint.includes('local') || hint.includes('mock')) {
    return localMock(run, 'local');
  }
  const openAI = await runOpenAI(run);
  if (openAI.error && !openAI.output) {
    return localMock(run, 'fallback');
  }
  return openAI;
}

async function runOpenAI(run: LLMRun) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return { error: 'OPENAI_API_KEY not set' };
  }
  const body = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: `${run.task}: ${run.prompt}` }],
    temperature: 0.7
  };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) return { error: 'openai failed', status: res.status };
  const json = await res.json();
  return { model: body.model, output: json.choices?.[0]?.message?.content || '', usage: json.usage };
}

function localMock(run: LLMRun, source: 'local' | 'fallback') {
  const templates: Record<LLMRun['task'], string> = {
    draft_copy: `Draft copy (mock): ${summarize(run.prompt, 160)}`,
    summarize: `Summary (mock): ${summarize(run.prompt, 120)}`,
    classify: `Classification (mock): ${classify(run.prompt)}`
  };
  return {
    model: `${source}:mock`,
    output: templates[run.task],
    mock: true
  };
}

function summarize(input: string, limit: number) {
  if (!input) return 'No input provided.';
  return input.length > limit ? input.slice(0, limit).trimEnd() + '…' : input;
}

function classify(input: string) {
  if (!input) return 'No categories detected.';
  const keywords = ['pricing', 'roadmap', 'ops', 'research', 'risk'];
  const hits = keywords.filter((kw) => input.toLowerCase().includes(kw));
  return hits.length ? `Tags: ${hits.join(', ')}` : 'Tags: general';
}
