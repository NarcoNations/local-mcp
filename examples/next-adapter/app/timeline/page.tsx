import { TimelineView } from "../../src/components/timeline/TimelineView";
import { fetchTimeline } from "../../src/data/timeline";

export default async function TimelinePage() {
  const events = await fetchTimeline();
  return <TimelineView events={events} />;
}
