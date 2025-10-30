import type { LLMRun, LLMTask } from '../../types';

const supportedTasks: LLMTask[] = ['draft_copy', 'summarize', 'classify'];

export async function runLLM(run: LLMRun) {
  if (!run.prompt || !run.prompt.trim()) {
    return { error: 'prompt required', status: 400 };
  }
  if (!supportedTasks.includes(run.task)) {
    return { error: 'unsupported task', status: 400 };
  }
  const hint = (run.modelHint || '').toLowerCase();
  if (!hint || hint.includes('local') || !process.env.OPENAI_API_KEY) {
    return runLocal(run);
  }
  return runOpenAI(run);
}

function runLocal(run: LLMRun) {
  const trimmed = run.prompt.trim();
  const prefix = run.task === 'classify' ? 'Classification' : run.task === 'summarize' ? 'Summary' : 'Draft';
  return {
    model: 'local:mock',
    output: `${prefix} (mock) → ${trimmed.slice(0, 280)}${trimmed.length > 280 ? '…' : ''}`
  };
}

async function runOpenAI(run: LLMRun) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return runLocal(run);
  const body = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: `${run.task}: ${run.prompt}` }],
    temperature: 0.7
  };
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) return { error: 'openai failed', status: res.status };
    const json = await res.json();
    return { model: body.model, output: json.choices?.[0]?.message?.content || '' };
  } catch (err: any) {
    return { error: err?.message || 'openai request failed', status: 500 };
  }
}
