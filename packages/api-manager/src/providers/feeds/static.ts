import type { FeedProvider, FeedRequest, FeedProviderContext, NormalizedFeedResponse } from '../../types.js';

const MOCK_DATA: Record<string, NormalizedFeedResponse> = {
  'LOCAL:OVERVIEW': {
    symbol: 'LOCAL',
    dataset: 'companyOverview',
    providerId: 'localStatic',
    receivedAt: new Date().toISOString(),
    data: {
      type: 'overview',
      name: 'Local Research Cooperative',
      description:
        'Synthetic overview generated for offline validation and UI development when external feeds are unavailable.',
      exchange: 'OTC',
      currency: 'USD',
      sector: 'Information Services',
      industry: 'Knowledge Platforms',
      website: 'https://example.invalid',
      metrics: [
        { key: 'MarketCapitalization', label: 'Market Cap', value: 12500000 },
        { key: 'Employees', label: 'Team', value: 18 },
        { key: 'Beta', label: 'Beta', value: 0.4 },
      ],
    },
    cacheTtlSeconds: 60 * 60,
  },
};

export class StaticFeedProvider implements FeedProvider {
  readonly metadata = {
    id: 'localStatic',
    label: 'Local mock data',
    description: 'Offline dataset for smoke-testing feed integrations.',
  } as const;

  supports(request: FeedRequest): boolean {
    return request.dataset === 'companyOverview' && request.symbol.toUpperCase() === 'LOCAL';
  }

  async fetch(_request: FeedRequest, _context: FeedProviderContext): Promise<NormalizedFeedResponse> {
    const key = 'LOCAL:OVERVIEW';
    const entry = MOCK_DATA[key];
    if (!entry) {
      throw new Error('Static feed missing');
    }
    return { ...entry, receivedAt: new Date().toISOString() };
  }
}

export function createStaticFeedProvider(): FeedProvider {
  return new StaticFeedProvider();
}
