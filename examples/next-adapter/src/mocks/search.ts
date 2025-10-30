import { SearchResult } from '../types/systems';

export const mockSearchResults: SearchResult[] = [
  {
    id: 'sr-001',
    title: 'Ops: Vision Drop Summary',
    snippet: 'Converged insights from the latest vision drop with cues on hardware supply lines…',
    score: 0.92,
    source: 'knowledge',
    slug: 'labs/vision-drop',
  },
  {
    id: 'sr-002',
    title: 'Historian: Ingest Completed — labs/vision-drop',
    snippet: 'Historian recorded ingest.completed for labs/vision-drop at 03:02 UTC.',
    score: 0.88,
    source: 'historian',
  },
  {
    id: 'sr-003',
    title: 'Workroom sticky: Vision drop QA',
    snippet: 'QA run flagged potential gaps in sensor calibration — follow-up required.',
    score: 0.81,
    source: 'workroom',
  },
];
