import { describe, expect, it } from "vitest";
import {
  ApiManager,
  ProviderError,
  type FeedProvider,
  type FeedRequest,
  type LLMProvider,
  type LLMRun,
} from "@vibelabz/api-manager";

function createLLMRun(overrides: Partial<LLMRun> = {}): LLMRun {
  return {
    task: "summarize",
    prompt: "Summarise the world",
    ...overrides,
  } satisfies LLMRun;
}

describe("ApiManager LLM routing", () => {
  it("prefers providers that match the model hint", async () => {
    const local: LLMProvider = {
      name: "local",
      supports: (run) => (run.modelHint ?? "").toLowerCase().includes("local"),
      priority: () => 100,
      invoke: async () => ({ model: "local", output: "local" }),
    };
    const remote: LLMProvider = {
      name: "remote",
      supports: () => true,
      priority: () => 10,
      invoke: async () => ({ model: "remote", output: "remote" }),
    };
    const manager = new ApiManager({ llm: { providers: [remote, local] } });
    const result = await manager.runLLM(createLLMRun({ modelHint: "LOCAL" }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider).toBe("local");
      expect(result.cached).toBeUndefined();
    }
  });

  it("falls back when the primary provider throws", async () => {
    let attempts = 0;
    const flaky: LLMProvider = {
      name: "flaky",
      supports: () => true,
      priority: () => 50,
      invoke: async () => {
        attempts += 1;
        throw new ProviderError("boom", "FAIL");
      },
    };
    const reliable: LLMProvider = {
      name: "reliable",
      supports: () => true,
      priority: () => 10,
      invoke: async () => ({ model: "reliable", output: "ok" }),
    };
    const manager = new ApiManager({ llm: { providers: [flaky, reliable] } });
    const result = await manager.runLLM(createLLMRun({ modelHint: "remote" }));
    expect(attempts).toBe(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider).toBe("reliable");
    }
  });

  it("marks cache hits on repeated runs", async () => {
    const provider: LLMProvider = {
      name: "cached",
      supports: () => true,
      invoke: async () => ({ model: "cached", output: "ok" }),
    };
    const manager = new ApiManager({ llm: { providers: [provider] } });
    const run = createLLMRun({ modelHint: "cached" });
    const first = await manager.runLLM(run);
    const second = await manager.runLLM(run);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.cached).toBe(true);
    }
  });

  it("surfaces errors when all providers fail", async () => {
    const failing: LLMProvider = {
      name: "fail",
      supports: () => true,
      invoke: async () => {
        throw new ProviderError("nope", "BROKEN");
      },
    };
    const manager = new ApiManager({ llm: { providers: [failing] } });
    const result = await manager.runLLM(createLLMRun());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.attempts?.[0]).toMatchObject({ provider: "fail", code: "BROKEN" });
    }
  });
});

describe("ApiManager feed routing", () => {
  const feedRequest: FeedRequest = { symbol: "MSFT", fn: "OVERVIEW" };

  it("uses the highest priority provider", async () => {
    const slow: FeedProvider = {
      name: "slow",
      supports: () => true,
      priority: () => 1,
      fetch: async () => ({ slow: true }),
    };
    const fast: FeedProvider = {
      name: "fast",
      supports: () => true,
      priority: () => 10,
      fetch: async () => ({ fast: true }),
    };
    const manager = new ApiManager({ feeds: { providers: [slow, fast] } });
    const result = await manager.fetchFeed(feedRequest);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider).toBe("fast");
    }
  });

  it("falls back to secondary feeds when the first fails", async () => {
    const primary: FeedProvider = {
      name: "primary",
      supports: () => true,
      fetch: async () => {
        throw new ProviderError("timeout", "TIMEOUT");
      },
    };
    const secondary: FeedProvider = {
      name: "secondary",
      supports: () => true,
      fetch: async () => ({ ok: true }),
    };
    const manager = new ApiManager({ feeds: { providers: [primary, secondary] } });
    const result = await manager.fetchFeed(feedRequest);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider).toBe("secondary");
    }
  });

  it("reports aggregated errors when all feeds fail", async () => {
    const primary: FeedProvider = {
      name: "primary",
      supports: () => true,
      fetch: async () => {
        throw new ProviderError("bad", "FAIL");
      },
    };
    const secondary: FeedProvider = {
      name: "secondary",
      supports: () => true,
      fetch: async () => {
        throw new ProviderError("worse", "FAIL");
      },
    };
    const manager = new ApiManager({ feeds: { providers: [primary, secondary] } });
    const result = await manager.fetchFeed(feedRequest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.attempts?.length).toBe(2);
    }
  });
});
