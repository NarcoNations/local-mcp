import { ProviderError, type FeedRequest, type FeedResult, type QuoteDTO, type TimeseriesDTO, type CompanyDTO } from '../../types.js';
import type { FeedProvider, ProviderExecutionContext } from './types.js';

async function unsupportedQuote(_symbol: string, _ctx: ProviderExecutionContext): Promise<FeedResult<QuoteDTO>> {
  throw new ProviderError('Polygon support requires paid tier; request blocked', { status: 403 });
}

async function unsupportedTimeseries(
  _symbol: string,
  _request: FeedRequest,
  _ctx: ProviderExecutionContext
): Promise<FeedResult<TimeseriesDTO>> {
  throw new ProviderError('Polygon support requires paid tier; request blocked', { status: 403 });
}

async function unsupportedCompany(_symbol: string, _ctx: ProviderExecutionContext): Promise<FeedResult<CompanyDTO>> {
  throw new ProviderError('Polygon support requires paid tier; request blocked', { status: 403 });
}

export const polygonProvider: FeedProvider = {
  id: 'polygon',
  name: 'Polygon (placeholder)',
  supports: { quote: true, timeseries: true, company: true },
  getQuote: unsupportedQuote,
  getTimeseries: unsupportedTimeseries,
  getCompany: unsupportedCompany,
};

