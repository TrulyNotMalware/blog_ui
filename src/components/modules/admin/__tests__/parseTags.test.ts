import { describe, it, expect } from "vitest";
import { parseTags } from "../EditorForm";

describe("parseTags", () => {
  it("중복 태그 제거", () => {
    expect(parseTags("foo, foo, bar")).toEqual(["foo", "bar"]);
  });

  it("공백 트림 후 dedup", () => {
    expect(parseTags("  spring , spring  ")).toEqual(["spring"]);
  });

  it("빈 문자열 → 빈 배열", () => {
    expect(parseTags("")).toEqual([]);
  });

  it("단일 태그 → 그대로 반환", () => {
    expect(parseTags("react")).toEqual(["react"]);
  });

  it("대소문자 소문자로 통일 (lowercase)", () => {
    expect(parseTags("React, react")).toEqual(["react"]);
  });

  it("쉼표만 있는 경우 빈 배열", () => {
    expect(parseTags(",,,")).toEqual([]);
  });

  it("공백 포함 여러 태그 정상 파싱", () => {
    expect(parseTags("foo, bar, baz")).toEqual(["foo", "bar", "baz"]);
  });
});
