import { DashboardView } from "../src/components/dashboard/DashboardView";
import {
  getCorpusStats,
  getHistorianEvents,
  getIngestConversions,
  getKnowledgeEntries,
} from "../src/data/dashboard";

export default async function Page() {
  const [historianEvents, ingestConversions, corpusStats, knowledgeEntries] = await Promise.all([
    getHistorianEvents(),
    getIngestConversions(),
    getCorpusStats(),
    getKnowledgeEntries(),
  ]);

  return (
    <DashboardView
      historianEvents={historianEvents}
      ingestConversions={ingestConversions}
      corpusStats={corpusStats}
      knowledgeEntries={knowledgeEntries}
    />
  );
}
