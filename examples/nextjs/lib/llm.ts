export interface RunLLMInput {
  task: string;
  prompt: string;
  modelHint?: string;
}

export interface RunLLMResult {
  task: string;
  prompt: string;
  model?: string;
  output?: string;
  error?: string;
  meta?: Record<string, unknown>;
}

let loadAttempted = false;
let runLLMImpl: ((input: RunLLMInput) => Promise<RunLLMResult>) | null = null;

async function loadExternal(): Promise<void> {
  if (loadAttempted) return;
  loadAttempted = true;
  try {
    const mod = await import('@vibelabz/api-manager');
    if (typeof mod.runLLM === 'function') {
      runLLMImpl = mod.runLLM as (input: RunLLMInput) => Promise<RunLLMResult>;
    }
  } catch {
    runLLMImpl = null;
  }
}

export async function runLLM(input: RunLLMInput): Promise<RunLLMResult> {
  await loadExternal();
  if (!runLLMImpl) {
    return {
      ...input,
      error: 'api-manager package not installed; returning stub response'
    };
  }
  return runLLMImpl(input);
}
