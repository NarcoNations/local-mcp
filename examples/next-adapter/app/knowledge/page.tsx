import { KnowledgeView } from "../../src/components/knowledge/KnowledgeView";
import { listKnowledge } from "../../src/data/knowledge";

export default async function KnowledgePage() {
  const entries = await listKnowledge();
  return <KnowledgeView entries={entries} />;
}
