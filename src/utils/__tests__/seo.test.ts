import { describe, expect, it } from "vitest";
import type { Post, Tag } from "@/types";
import {
  buildSitemap,
  escapeXml,
  postUrl,
  stripInvalidXmlChars,
  tagUrl,
  toUtcDate,
} from "../seo";

const BS = String.fromCharCode(0x08);
const NUL = String.fromCharCode(0x00);

const samplePost = (id: string, overrides: Partial<Post> = {}): Post => ({
  id,
  title: "Title",
  excerpt: "Excerpt",
  tags: ["foo"],
  date: "2025-01-15",
  readTime: "5min",
  kind: "essay",
  ...overrides,
});

describe("stripInvalidXmlChars", () => {
  it("removes XML 1.0 invalid control chars (backspace, NUL)", () => {
    expect(stripInvalidXmlChars(`hello${BS}world`)).toBe("helloworld");
    expect(stripInvalidXmlChars(`a${BS}b${NUL}cd`)).toBe("abcd");
  });

  it("preserves tab, lf, cr", () => {
    expect(stripInvalidXmlChars("a\tb\nc\rd")).toBe("a\tb\nc\rd");
  });

  it("preserves Korean and other BMP chars", () => {
    expect(stripInvalidXmlChars("hangul test")).toBe("hangul test");
  });

  it("preserves emoji (astral plane)", () => {
    expect(stripInvalidXmlChars("a😀b")).toBe("a😀b");
  });
});

describe("escapeXml", () => {
  it("escapes the five XML special chars", () => {
    expect(escapeXml(`<a href="b">&'</a>`)).toBe(
      "&lt;a href=&quot;b&quot;&gt;&amp;&apos;&lt;/a&gt;",
    );
  });

  it("returns input unchanged when no special chars", () => {
    expect(escapeXml("hello world")).toBe("hello world");
  });

  it("preserves order — does not double-escape ampersand", () => {
    expect(escapeXml("a & b < c")).toBe("a &amp; b &lt; c");
  });

  it("strips invalid control chars before escaping", () => {
    expect(escapeXml(`a${BS}&b`)).toBe("a&amp;b");
  });
});

describe("postUrl / tagUrl", () => {
  it("percent-encodes Korean slug", () => {
    expect(postUrl("https://x.dev", "한글-slug")).toBe(
      "https://x.dev/posts/%ED%95%9C%EA%B8%80-slug",
    );
  });

  it("tagUrl encodes name", () => {
    expect(tagUrl("https://x.dev", "java-kotlin")).toBe(
      "https://x.dev/tags/java-kotlin",
    );
  });
});

describe("toUtcDate", () => {
  it("returns epoch for undefined", () => {
    expect(toUtcDate(undefined).getTime()).toBe(0);
  });

  it("returns epoch for invalid input", () => {
    expect(toUtcDate("not-a-date").getTime()).toBe(0);
  });

  it("parses ISO date", () => {
    expect(toUtcDate("2025-01-15").toUTCString()).toBe(
      "Wed, 15 Jan 2025 00:00:00 GMT",
    );
  });
});

describe("buildSitemap", () => {
  it("includes static, tag, and post entries in order", () => {
    const posts = [samplePost("p1"), samplePost("p2")];
    const tags: Tag[] = [{ name: "foo", count: 2 }];
    const entries = buildSitemap({ siteUrl: "https://x.dev", posts, tags });
    expect(entries.map((e) => e.url)).toEqual([
      "https://x.dev/",
      "https://x.dev/tags",
      "https://x.dev/about",
      "https://x.dev/tags/foo",
      "https://x.dev/posts/p1",
      "https://x.dev/posts/p2",
    ]);
  });

  it("home page has priority 1", () => {
    const entries = buildSitemap({ siteUrl: "https://x.dev", posts: [], tags: [] });
    expect(entries[0].priority).toBe(1);
  });

  it("uses post.date for lastModified", () => {
    const posts = [samplePost("p1", { date: "2025-06-01" })];
    const entries = buildSitemap({ siteUrl: "https://x.dev", posts, tags: [] });
    const postEntry = entries.find((e) => e.url.endsWith("/posts/p1"));
    expect(postEntry?.lastModified.toUTCString()).toBe(
      "Sun, 01 Jun 2025 00:00:00 GMT",
    );
  });

  it("percent-encodes Korean tag and post slugs", () => {
    const posts = [samplePost("한글")];
    const tags: Tag[] = [{ name: "한글-태그", count: 1 }];
    const entries = buildSitemap({ siteUrl: "https://x.dev", posts, tags });
    expect(entries.some((e) => e.url.includes("%ED%95%9C%EA%B8%80"))).toBe(true);
  });
});

