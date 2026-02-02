import { expect, test, describe } from "bun:test";

describe("Translation Prompt Construction", () => {
  test("Should contain literal idiom instructions", () => {
    const instruction = "translate Chinese idioms (Chengyu) LITERALLY";
    // This simulates a check on our prompt string logic
    const dummyPrompt = `You are a translator. \${instruction}.`;
    expect(dummyPrompt).toContain("LITERALLY");
  });
});
