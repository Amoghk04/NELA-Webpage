import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyQueryComplexity,
  resolveCloudMode,
} from "./auto-router.js";

describe("auto-router", () => {
  it("classifies short chat as fast", () => {
    const tier = classifyQueryComplexity({
      messages: [{ role: "user", content: "Hi" }],
    });
    assert.equal(tier, "fast");
  });

  it("classifies coding help as smart", () => {
    const tier = classifyQueryComplexity({
      messages: [
        {
          role: "user",
          content: "Please refactor this function and implement error handling",
        },
      ],
    });
    assert.equal(tier, "smart");
  });

  it("classifies deep reasoning keywords as deep", () => {
    const tier = classifyQueryComplexity({
      messages: [
        {
          role: "user",
          content: "Prove step by step that this architecture is optimal",
        },
      ],
    });
    assert.equal(tier, "deep");
  });

  it("clamps unpaid auto deep to fast", () => {
    const r = resolveCloudMode({
      mode: "auto",
      messages: [
        {
          role: "user",
          content: "Prove step by step the formal theorem carefully",
        },
      ],
      paidWithQuota: false,
    });
    assert.equal(r.resolvedMode, "fast");
    assert.equal(r.clamped, true);
  });

  it("keeps deep for paid users", () => {
    const r = resolveCloudMode({
      mode: "deep",
      messages: [{ role: "user", content: "Hi" }],
      paidWithQuota: true,
    });
    assert.equal(r.resolvedMode, "deep");
    assert.equal(r.clamped, false);
  });
});
