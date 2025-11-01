import type {
  LLMRun,
  LLMRequest,
  LLMProvider,
  LLMProviderContext,
  NormalizedLLMResponse,
  ProviderCredentials,
  LLMRoutingConfig,
} from '../../types.js';
import { createLocalLLMProvider } from './local.js';
import { createOpenAIProvider } from './openai.js';

export interface LLMRouterOptions {
  credentials: ProviderCredentials;
  routing: LLMRoutingConfig;
  providers?: LLMProvider[];
  fetchImpl?: typeof fetch;
}

function matchesPolicy(run: LLMRun, policy: Required<LLMRoutingConfig>['policies'][number]): boolean {
  if (!policy.match) return true;
  const { tasks, modelHints, promptContains, providerIds } = policy.match;
  if (tasks && tasks.length > 0 && !tasks.includes(run.task)) {
    return false;
  }
  if (providerIds && providerIds.length > 0 && run.providerId && !providerIds.includes(run.providerId)) {
    return false;
  }
  if (modelHints && modelHints.length > 0) {
    const hint = (run.modelHint ?? '').toLowerCase();
    if (!modelHints.some((entry) => hint.includes(entry.toLowerCase()))) {
      return false;
    }
  }
  if (promptContains && promptContains.length > 0) {
    const prompt = run.prompt.toLowerCase();
    if (!promptContains.some((fragment) => prompt.includes(fragment.toLowerCase()))) {
      return false;
    }
  }
  return true;
}

export class LLMRouter {
  private readonly providers = new Map<string, LLMProvider>();
  private fetchImpl?: typeof fetch;

  constructor(private options: LLMRouterOptions) {
    const defaults = options.providers ?? [createLocalLLMProvider(), createOpenAIProvider()];
    defaults.forEach((provider) => this.registerProvider(provider));
    this.fetchImpl = options.fetchImpl;
  }

  registerProvider(provider: LLMProvider): void {
    this.providers.set(provider.metadata.id, provider);
  }

  updateOptions(options: Partial<LLMRouterOptions>): void {
    this.options = { ...this.options, ...options };
    if (options.routing) {
      this.options.routing = options.routing;
    }
    if (options.credentials) {
      this.options.credentials = options.credentials;
    }
    if (options.fetchImpl) {
      this.fetchImpl = options.fetchImpl;
    }
  }

  listProviders(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  async run(run: LLMRun): Promise<NormalizedLLMResponse> {
    const request = this.resolveRequest(run);
    const provider = this.providers.get(request.providerId ?? '');
    if (!provider) {
      throw new Error(`LLM provider not registered: ${request.providerId}`);
    }
    if (!provider.supports(request)) {
      throw new Error(`Provider ${request.providerId} cannot service this request`);
    }
    const context: LLMProviderContext = {
      credentials: this.options.credentials,
      fetchImpl: this.fetchImpl,
    };
    const response = await provider.invoke(request, context);
    return { ...response, policyId: request.policyId ?? response.policyId };
  }

  private resolveRequest(run: LLMRun): LLMRequest {
    if (run.providerId) {
      return { ...run, providerId: run.providerId };
    }
    const routing = this.options.routing;
    for (const policy of routing.policies) {
      if (matchesPolicy(run, policy)) {
        return {
          ...run,
          providerId: policy.target.providerId,
          modelHint: policy.target.model ?? run.modelHint,
          temperature: policy.target.temperature ?? undefined,
          maxTokens: policy.target.maxTokens,
          policyId: policy.id,
        };
      }
    }
    const providerId = routing.defaultProviderId ?? routing.fallbackProviderId;
    if (!providerId) {
      throw new Error('No default LLM provider configured');
    }
    return { ...run, providerId };
  }
}

export function createLLMRouter(options: LLMRouterOptions): LLMRouter {
  return new LLMRouter(options);
}
