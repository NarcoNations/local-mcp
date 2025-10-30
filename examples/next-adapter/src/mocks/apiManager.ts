import { ApiProbeResult } from '../types/systems';

export const mockApiResults: ApiProbeResult[] = [
  {
    id: 'probe-1001',
    type: 'alpha',
    request: { symbol: 'operator-signal', fn: 'analyze' },
    response: 'signal_strength: 0.82\nnotes: Pattern aligns with drop 17 cadence.',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'probe-1000',
    type: 'llm',
    request: { task: 'Summarize drop 17 narrative arcs' },
    response: 'Key beats: infiltration prep, supply sync, morale uplift. Ready for packaging.',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
];
