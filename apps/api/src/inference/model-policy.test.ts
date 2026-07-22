import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { selectModelForIntent } from "./model-policy.js";

describe("model-policy", () => {
  it("routes artifact_plan to a capable model", () => {
    assert.equal(selectModelForIntent("artifact_plan"), "openai/gpt-4o");
  });

  it("routes cheap_background to mini", () => {
    assert.equal(selectModelForIntent("cheap_background"), "openai/gpt-4o-mini");
  });
});
