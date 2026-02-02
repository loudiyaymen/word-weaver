import { expect, test, describe } from "bun:test";

describe("Chapter Logic", () => {
  test("Placeholder: logic should correctly identify next chapter", () => {
    const mockLastChapter = 5;
    const nextChapter = (last: number | undefined) => (last ? last + 1 : 1);

    expect(nextChapter(mockLastChapter)).toBe(6);
    expect(nextChapter(undefined)).toBe(1);
  });
});
