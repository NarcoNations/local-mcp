import { CorpusView } from "../../src/components/corpus/CorpusView";
import { getCorpusStats } from "../../src/data/dashboard";

export default async function CorpusPage() {
  const stats = await getCorpusStats();
  return <CorpusView stats={stats} />;
}
