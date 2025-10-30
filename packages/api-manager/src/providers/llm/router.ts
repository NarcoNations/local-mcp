import type { LLMRun } from '../../types';

export async function runLLM(run: LLMRun) {
  const hint = (run.modelHint || '').toLowerCase();
  if (hint.includes('local')) return { model: 'local:mock', output: `[LOCAL] ${run.task}: ${run.prompt.slice(0,120)}...` };
  return runOpenAI(run);
}

async function runOpenAI(run: LLMRun) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { error: 'OPENAI_API_KEY not set (skeleton)' };
  const body = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: `${run.task}: ${run.prompt}` }],
    temperature: 0.7
  };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) return { error: 'openai failed', status: res.status };
  const json = await res.json();
  return { model: body.model, output: json.choices?.[0]?.message?.content || '' };
}
