import { ApiManager } from '../../manager.js';
import { createDefaultApiManager } from '../../defaults.js';
import { LLMRun, LLMRunResult, ProviderContext } from '../../types.js';

let defaultManager: ApiManager | null = null;

function getManager(): ApiManager {
  if (!defaultManager) {
    defaultManager = createDefaultApiManager();
  }
  return defaultManager;
}

export async function runLLM(run: LLMRun, context?: ProviderContext): Promise<LLMRunResult> {
  return getManager().runLLM(run, context);
}
