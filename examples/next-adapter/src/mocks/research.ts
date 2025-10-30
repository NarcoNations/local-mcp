import { ResearchResult } from '../types/systems';

export const mockResearchResult: ResearchResult = {
  query: 'supply chain risk for drop 17',
  facts: [
    'Historian recorded two ingest failures on cold storage for drop 17.',
    'Knowledge node narconations/opsec-field-manual highlights supply redundancies.',
  ],
  insights: [
    'Re-route cold storage to hot lane for time-sensitive drops.',
    'Pair ingest completion with auto-generated QA prompts for operators.',
  ],
  sources: [
    { title: 'Historian Event tl-1006', url: '#timeline/tl-1006' },
    { title: 'Knowledge: opsec-field-manual', url: '#knowledge/kn-3004' },
  ],
};
