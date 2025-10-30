import { getTimelineEvents } from '../../src/data/timeline';
import { TimelineView } from '../../src/components/timeline/TimelineView';

export default async function Page() {
  const events = await getTimelineEvents();
  return <TimelineView events={events} />;
}
