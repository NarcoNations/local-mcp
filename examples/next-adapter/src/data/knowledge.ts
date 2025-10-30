import { USE_MOCKS } from '../config';
import { knowledgeMock, type KnowledgeEntry } from '../mocks/knowledge';

export async function getKnowledgeEntries(): Promise<KnowledgeEntry[]> {
  if (USE_MOCKS) {
    return knowledgeMock;
  }

  return knowledgeMock;
}
