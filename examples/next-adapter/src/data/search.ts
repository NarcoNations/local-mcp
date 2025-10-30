import { USE_MOCKS } from '../config';
import { searchMock, type SearchResult } from '../mocks/search';

export async function searchEverything(query: string): Promise<SearchResult[]> {
  if (!query) return [];
  if (USE_MOCKS) {
    return searchMock(query);
  }

  return searchMock(query);
}
