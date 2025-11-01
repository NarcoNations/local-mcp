import type {
  LLMProvider,
  LLMRequest,
  LLMProviderContext,
  NormalizedLLMResponse,
} from '../../types.js';

const TASK_HINTS: Record<string, string> = {
  summarize: 'Summary',
  classify: 'Classification',
  qa: 'Answer',
  draft_copy: 'Draft',
  chat: 'Reply',
};

export class LocalLLMProvider implements LLMProvider {
  readonly metadata = {
    id: 'local',
    label: 'Local mock',
    description: 'Local deterministic responder for smoke-tests and offline flows.',
  } as const;

  supports(_request: LLMRequest): boolean {
    return true;
  }

  async invoke(request: LLMRequest, _context: LLMProviderContext): Promise<NormalizedLLMResponse> {
    const started = Date.now();
    const hint = TASK_HINTS[request.task] ?? 'Response';
    const output = `${hint}: ${request.prompt.slice(0, 280)}${request.prompt.length > 280 ? '…' : ''}`;
    const latencyMs = Date.now() - started;
    return {
      providerId: this.metadata.id,
      model: 'local:mock',
      task: request.task,
      output,
      latencyMs,
      raw: { echo: true, promptPreview: request.prompt.slice(0, 280) },
      policyId: request.policyId,
    };
  }
}

export function createLocalLLMProvider(): LLMProvider {
  return new LocalLLMProvider();
}
