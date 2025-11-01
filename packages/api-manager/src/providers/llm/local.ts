import { BaseLLMProvider } from "./base";
import {
  LLMProvider,
  LLMProviderDescriptor,
  LLMRunRequest,
  LLMRunResult,
  LocalProviderConfig,
  ProviderInvokeOptions,
} from "../../types";

interface CreateLocalProviderResult {
  descriptor: LLMProviderDescriptor;
  provider: LLMProvider | null;
}

const DEFAULT_MODEL_ID = "mock-local";

export function createLocalProvider(config: LocalProviderConfig): CreateLocalProviderResult {
  const disabledReason = config.disabled ? config.disabledReason ?? "Provider disabled via configuration" : undefined;
  const models = (config.models && config.models.length ? config.models : [DEFAULT_MODEL_ID]).filter(Boolean);
  const descriptor: LLMProviderDescriptor = {
    id: config.id,
    type: "local",
    label: config.label ?? "Local Adapter",
    description: config.description ?? "Local development fallback provider",
    available: !config.disabled,
    disabledReason: config.disabled ? disabledReason : undefined,
    models: models.map((id) => ({ id, label: id })),
    tags: [...(config.tags ?? []), "local"],
    metadata: config.metadata ?? {},
  };

  if (!descriptor.available) {
    return { descriptor, provider: null };
  }

  class LocalProvider extends BaseLLMProvider {
    constructor() {
      super(descriptor);
    }

    async invoke(request: LLMRunRequest, _options?: ProviderInvokeOptions): Promise<LLMRunResult> {
      const prefix = config.defaultResponsePrefix ?? "[LOCAL MOCK]";
      const teaser = request.prompt.length > 240 ? `${request.prompt.slice(0, 240)}…` : request.prompt;
      return {
        providerId: descriptor.id,
        providerLabel: descriptor.label,
        model: request.model ?? request.modelHint ?? models[0],
        output: `${prefix} ${request.task}: ${teaser}`,
        usage: { cached: true },
        cached: true,
        metadata: {
          echo: true,
        },
      };
    }
  }

  return { descriptor, provider: new LocalProvider() };
}
