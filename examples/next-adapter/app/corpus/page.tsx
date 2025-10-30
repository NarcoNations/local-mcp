import { getCorpusSummary } from '../../src/data/corpus';
import { CorpusView } from '../../src/components/corpus/CorpusView';

export default async function Page() {
  const summary = await getCorpusSummary();
  return <CorpusView summary={summary} />;
}
