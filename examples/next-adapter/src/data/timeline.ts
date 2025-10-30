import { USE_MOCKS } from "../config/env";
import { mockTimeline } from "../mocks/dashboard";
import type { TimelineEvent } from "../types/app";

const TIMELINE_API = "/api/timeline";

export async function fetchTimeline(limit = 25): Promise<TimelineEvent[]> {
  if (USE_MOCKS) {
    return mockTimeline.slice(0, limit);
  }
  try {
    const response = await fetch(`${TIMELINE_API}?limit=${limit}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch timeline");
    const data = (await response.json()) as TimelineEvent[];
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return mockTimeline.slice(0, limit);
  } catch (error) {
    console.warn("timeline fallback", error);
    return mockTimeline.slice(0, limit);
  }
}
