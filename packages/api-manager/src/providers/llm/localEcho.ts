import { LLMProvider, LLMRun } from '../../types.js';
import { ProviderError } from '../../utils.js';

export interface LocalLLMProviderOptions {
  name?: string;
  prefix?: string;
  supports?: (run: LLMRun) => boolean;
}

export function createLocalLLMProvider(options: LocalLLMProviderOptions = {}): LLMProvider {
  const providerName = options.name ?? 'local-echo';
  const prefix = options.prefix ?? '[LOCAL]';
  return {
    name: providerName,
    supports(run: LLMRun) {
      if (options.supports) return options.supports(run);
      const hint = run.modelHint?.toLowerCase() ?? '';
      return hint.includes('local');
    },
    priority(run: LLMRun) {
      const hint = run.modelHint?.toLowerCase() ?? '';
      return hint.includes('local') ? 100 : 0;
    },
    async invoke(run: LLMRun) {
      if (!run.prompt?.trim()) {
        throw new ProviderError('Prompt is required for local provider', 'PROMPT_REQUIRED');
      }
      return {
        model: 'local:mock',
        output: `${prefix} ${run.task}: ${run.prompt.slice(0, 200)}`,
        usage: {
          promptTokens: run.prompt.length,
          completionTokens: Math.min(200, run.prompt.length),
          totalTokens: run.prompt.length + Math.min(200, run.prompt.length),
        },
      };
    },
  } satisfies LLMProvider;
}
