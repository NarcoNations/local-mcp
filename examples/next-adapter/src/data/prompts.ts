import { USE_MOCKS } from '../config';
import { promptsMock, type PromptDefinition } from '../mocks/prompts';

export async function getPrompts(): Promise<PromptDefinition[]> {
  if (USE_MOCKS) {
    return promptsMock;
  }

  return promptsMock;
}
