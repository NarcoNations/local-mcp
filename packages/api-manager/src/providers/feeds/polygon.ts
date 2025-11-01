import type { FeedRequest, FeedResult } from '../../types';

export async function fetchPolygon(request: FeedRequest): Promise<FeedResult> {
  return {
    provider: 'polygon',
    kind: request.kind,
    meta: {
      cache: 'none',
      cached: false,
      key: `${request.provider}:${request.kind}:${request.symbol}`,
      requestedAt: new Date().toISOString(),
      latencyMs: 0,
      status: 403
    },
    error: {
      message: 'Polygon provider requires paid tier — stubbed in M2',
      details: { note: 'Guarded to avoid 403 quota hits' }
    }
  };
}
