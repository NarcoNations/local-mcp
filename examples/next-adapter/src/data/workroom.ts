import { USE_MOCKS } from "../config/env";
import { mockStickies } from "../mocks/dashboard";
import type { WorkroomSticky } from "../types/app";

export async function getInitialStickies(): Promise<WorkroomSticky[]> {
  if (USE_MOCKS) {
    return mockStickies;
  }
  return mockStickies;
}
