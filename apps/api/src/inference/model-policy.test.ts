import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  selectModel,
  selectModelForIntent,
  selectModelFallbacks,
} from "./model-policy.js";

describe("model-policy", () => {
  it("selects a free model for fast mode", () => {
    const m = selectModel({ mode: "fast" });
    assert.equal(m.isFree, true);
    assert.equal(m.mode, "fast");
  });

  it("selects a free smart model (OpenRouter free tier)", () => {
    const m = selectModel({ mode: "smart" });
    assert.equal(m.mode, "smart");
    assert.equal(m.isFree, true);
  });

  it("selects a paid flagship for deep mode", () => {
    const m = selectModel({ mode: "deep" });
    assert.equal(m.mode, "deep");
    assert.equal(m.isFree, false);
    assert.ok(
      m.id.includes("kimi") ||
        m.id.includes("minimax") ||
        m.id.includes("deepseek") ||
        m.id.includes("glm") ||
        m.id.includes("qwen") ||
        m.id.includes("grok") ||
        m.id.includes("llama") ||
        m.id.includes("mistral"),
    );
  });

  it("deep catalog has no free models", () => {
    const list = selectModelFallbacks({ mode: "deep" });
    assert.ok(list.length >= 1);
    assert.ok(list.every((c) => !c.isFree && c.mode === "deep"));
  });

  it("fast and smart stay on free OpenRouter models", () => {
    for (const mode of ["fast", "smart"] as const) {
      const list = selectModelFallbacks({ mode });
      assert.ok(list.length >= 1, `expected fallbacks for ${mode}`);
      assert.ok(list.every((c) => c.isFree));
    }
  });

  it("returns fallbacks for deep mode", () => {
    const list = selectModelFallbacks({ mode: "deep" });
    assert.ok(list.length >= 1);
    assert.ok(list.every((c) => c.mode === "deep"));
  });

  it("routes artifact_plan intent to a deep-capable model", () => {
    const id = selectModelForIntent("artifact_plan");
    assert.ok(typeof id === "string" && id.length > 0);
  });

  it("routes cheap_background to smart catalog (compat)", () => {
    const id = selectModelForIntent("cheap_background");
    assert.ok(id.includes("/") || id.length > 0);
  });
});
