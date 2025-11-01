export interface WatchActivity {
  sessionId: string;
  paths: string[];
  startedAt: string;
  lastEventAt?: string;
  lastEvent?: Record<string, unknown>;
  eventCount: number;
}

interface WatchState extends WatchActivity {
  started: number;
}

function normalizeSessionId(sessionId: string | undefined): string {
  return sessionId && sessionId.trim().length ? sessionId : "global";
}

export class WatchTracker {
  private sessions = new Map<string, WatchState>();

  start(sessionId: string | undefined, paths: string[]): WatchActivity {
    const id = normalizeSessionId(sessionId);
    const now = Date.now();
    const state: WatchState = {
      sessionId: id,
      paths: [...paths],
      startedAt: new Date(now).toISOString(),
      started: now,
      eventCount: 0,
    };
    this.sessions.set(id, state);
    return { ...state };
  }

  recordEvent(sessionId: string | undefined, event: Record<string, unknown>): void {
    const id = normalizeSessionId(sessionId);
    const state = this.sessions.get(id);
    const now = new Date().toISOString();
    if (!state) {
      this.sessions.set(id, {
        sessionId: id,
        paths: [],
        startedAt: now,
        started: Date.now(),
        lastEventAt: now,
        lastEvent: { ...event },
        eventCount: 1,
      });
      return;
    }
    state.lastEventAt = now;
    state.lastEvent = { ...event };
    state.eventCount += 1;
  }

  stop(sessionId: string | undefined): void {
    const id = normalizeSessionId(sessionId);
    this.sessions.delete(id);
  }

  list(): WatchActivity[] {
    return Array.from(this.sessions.values()).map(({ started, ...rest }) => ({
      ...rest,
    }));
  }
}
