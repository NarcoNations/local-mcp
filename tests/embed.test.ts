import { describe, expect, test, vi } from "vitest";

vi.mock("@xenova/transformers", () => ({
  pipeline: vi.fn(async () => async (text: string) => ({ data: [text.length, text.split(/\s+/).length] })),
}));

import { embedText, onModelStatus } from "../src/pipeline/embed.js";

describe("embed pipeline", () => {
  test("returns Float32Array vectors", async () => {
    const vec = await embedText("alpha bravo", "fake-model");
    expect(vec).toBeInstanceOf(Float32Array);
    expect(vec.length).toBeGreaterThan(0);
  });

  test("invokes status callbacks", async () => {
    const spy = vi.fn();
    onModelStatus(spy);
    await embedText("sample", "fake-model");
    expect(spy).toHaveBeenCalledWith("loading");
    expect(spy).toHaveBeenCalledWith("ready");
  });
});
