import { USE_MOCKS } from "../config/env";
import { mockPrompts } from "../mocks/dashboard";
import type { PromptTemplate } from "../types/app";

export async function listPrompts(): Promise<PromptTemplate[]> {
  if (USE_MOCKS) {
    return mockPrompts;
  }
  return mockPrompts;
}
