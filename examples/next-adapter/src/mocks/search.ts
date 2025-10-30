export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  score: number;
  source: string;
  link: string;
}

const baseResults: SearchResult[] = [
  {
    id: 'sr-01',
    title: 'Narco nations go-to-market briefing',
    snippet: 'Aggressive launch plan covering dark social, encrypted drops, and syndicate alliances.',
    score: 0.93,
    source: 'knowledge/founder-insights-2024',
    link: '/knowledge?slug=founder-insights-2024',
  },
  {
    id: 'sr-02',
    title: 'Counterintel summary — last 48h',
    snippet: 'Historian flagged 6 anomalies across rival cartels. See anomaly index 212 for context.',
    score: 0.88,
    source: 'historian/events',
    link: '/timeline',
  },
  {
    id: 'sr-03',
    title: 'Social sentiment delta — Narco Nations',
    snippet: 'Sentiment jumped +14% following the broadcast drop. Use prompt: social-forge:sentiment.',
    score: 0.86,
    source: 'social/playbooks',
    link: '/play/social',
  },
  {
    id: 'sr-04',
    title: 'Field ops: contraband supply lines',
    snippet: 'Borderless supply play outlines fallback routes, geofenced safe houses, and drop frequency.',
    score: 0.81,
    source: 'knowledge/contraband-supply-lines',
    link: '/knowledge?slug=contraband-supply-lines',
  },
];

export function searchMock(query: string): SearchResult[] {
  if (!query) return [];
  return baseResults.filter((result) => result.title.toLowerCase().includes(query.toLowerCase()));
}
