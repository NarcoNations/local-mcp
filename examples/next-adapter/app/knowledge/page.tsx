import { getKnowledgeEntries } from '../../src/data/knowledge';
import { KnowledgeView } from '../../src/components/knowledge/KnowledgeView';

export default async function Page() {
  const entries = await getKnowledgeEntries();
  return <KnowledgeView entries={entries} />;
}
