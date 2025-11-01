import { LLMProvider, LLMProviderDescriptor, LLMRunRequest, LLMRunResult, ProviderInvokeOptions } from "../../types";

export abstract class BaseLLMProvider implements LLMProvider {
  constructor(public readonly descriptor: LLMProviderDescriptor) {}

  canHandle(request: LLMRunRequest): boolean {
    if (!this.descriptor.available) return false;
    if (!request.modelHint && !request.model) return true;
    const hint = (request.model ?? request.modelHint ?? "").toLowerCase();
    return this.descriptor.models.some((model) => model.id.toLowerCase() === hint || model.label?.toLowerCase() === hint);
  }

  abstract invoke(request: LLMRunRequest, options?: ProviderInvokeOptions): Promise<LLMRunResult>;
}
