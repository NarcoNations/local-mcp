import { USE_MOCKS } from '../config';
import { corpusMock, type CorpusSummary } from '../mocks/corpus';

export async function getCorpusSummary(): Promise<CorpusSummary> {
  if (USE_MOCKS) {
    return corpusMock;
  }

  return corpusMock;
}
