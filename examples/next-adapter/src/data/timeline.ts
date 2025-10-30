import { USE_MOCKS } from '../config';
import { timelineMock, type TimelineEvent } from '../mocks/timeline';

export async function getTimelineEvents(): Promise<TimelineEvent[]> {
  if (USE_MOCKS) {
    return timelineMock;
  }

  return timelineMock;
}
