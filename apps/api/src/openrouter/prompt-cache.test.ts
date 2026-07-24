import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyMessageCacheBreakpoints,
  applyToolCacheBreakpoints,
  buildCachedOpenRouterRequest,
} from "./prompt-cache.js";

describe("prompt caching", () => {
  it("marks only the first system message with cache_control", () => {
    const out = applyMessageCacheBreakpoints([
      { role: "system", content: "Identity prompt" },
      { role: "system", content: "Dynamic session context" },
      { role: "user", content: "Hello" },
    ]);

    assert.deepEqual(out[0]!.content, [
      {
        type: "text",
        text: "Identity prompt",
        cache_control: { type: "ephemeral", ttl: "1h" },
      },
    ]);
    assert.equal(out[1]!.content, "Dynamic session context");
    assert.equal(out[2]!.content, "Hello");
  });

  it("marks the last tool with cache_control", () => {
    const tools = applyToolCacheBreakpoints([
      {
        type: "function",
        function: { name: "web_search", parameters: {} },
      },
      {
        type: "function",
        function: { name: "generate_html", parameters: {} },
      },
    ]);

    assert.equal(
      (tools?.[0] as { cache_control?: unknown }).cache_control,
      undefined,
    );
    assert.deepEqual(
      (tools?.[1] as { cache_control?: unknown }).cache_control,
      { type: "ephemeral", ttl: "1h" },
    );
  });

  it("adds session_id and Anthropic top-level cache_control", () => {
    const body = buildCachedOpenRouterRequest({
      model: "anthropic/claude-sonnet-4",
      messages: [{ role: "system", content: "You are NELA." }],
      sessionId: "desktop-session-abc",
      stream: true,
    });

    assert.equal(body.session_id, "desktop-session-abc");
    assert.deepEqual(body.cache_control, { type: "ephemeral", ttl: "1h" });
  });

  it("does not add top-level cache_control for non-Anthropic models", () => {
    const body = buildCachedOpenRouterRequest({
      model: "moonshotai/kimi-k2.5",
      messages: [{ role: "system", content: "You are NELA." }],
      sessionId: "s1",
    });

    assert.equal(body.session_id, "s1");
    assert.equal(body.cache_control, undefined);
    assert.deepEqual(body.messages[0]!.content, [
      {
        type: "text",
        text: "You are NELA.",
        cache_control: { type: "ephemeral", ttl: "1h" },
      },
    ]);
  });
});
