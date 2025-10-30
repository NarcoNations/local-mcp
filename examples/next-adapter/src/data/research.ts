import { USE_MOCKS } from "../config/env";
import { mockResearch } from "../mocks/dashboard";
import type { ResearchResponse } from "../types/app";

export async function runResearch(query: string, objectives: string[]): Promise<ResearchResponse> {
  if (USE_MOCKS) {
    return { ...mockResearch, query };
  }
  return { ...mockResearch, query };
}
