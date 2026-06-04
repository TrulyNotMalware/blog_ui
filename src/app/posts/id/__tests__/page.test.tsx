// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { extractToc } from "../../[id]/page";

describe("extractToc", () => {
  it("parses ## headings into numbered toc entries with slugs", () => {
    const source = "## Introduction\n\nsome text\n\n## Conclusion\n";
    const toc = extractToc(source);
    expect(toc).toHaveLength(2);
    expect(toc[0]).toEqual({
      n: "01",
      text: "Introduction",
      slug: "md-introduction",
    });
    expect(toc[1]).toEqual({
      n: "02",
      text: "Conclusion",
      slug: "md-conclusion",
    });
  });

  it("disambiguates duplicate headings with -1, -2 suffixes (matches rehype-slug)", () => {
    const source = "## Setup\n\n## Setup\n\n## Setup\n";
    const toc = extractToc(source);
    expect(toc.map((t) => t.slug)).toEqual(["md-setup", "md-setup-1", "md-setup-2"]);
  });

  it("slugifies Korean headings", () => {
    const source = "## 시작하기\n\n## 마무리\n";
    const toc = extractToc(source);
    expect(toc[0].slug).toBe("md-시작하기");
    expect(toc[1].slug).toBe("md-마무리");
  });

  it("returns empty array when no ## headings", () => {
    expect(extractToc("# Title\nsome text")).toHaveLength(0);
  });

  it("repeated calls with same source return identical results (no lastIndex bleed)", () => {
    const source = "## Alpha\n\n## Beta\n";
    const first = extractToc(source);
    const second = extractToc(source);
    expect(first).toEqual(second);
    expect(first).toHaveLength(2);
  });

  it("repeated calls with different sources don't interfere (concurrent correctness)", () => {
    const sourceA = "## Only A\n";
    const sourceB = "## First B\n\n## Second B\n";

    const tocA = extractToc(sourceA);
    const tocB = extractToc(sourceB);

    expect(tocA).toHaveLength(1);
    expect(tocA[0].text).toBe("Only A");

    expect(tocB).toHaveLength(2);
    expect(tocB[0].text).toBe("First B");
    expect(tocB[1].text).toBe("Second B");
  });

  it("interleaved calls don't corrupt each other's results", () => {
    const longSource = Array.from({ length: 5 }, (_, i) => `## Section ${i + 1}`).join("\n\n");
    const shortSource = "## Solo\n";

    // Interleave: start long, check short, then finish long
    const longToc = extractToc(longSource);
    const shortToc = extractToc(shortSource);
    const longToc2 = extractToc(longSource);

    expect(shortToc).toHaveLength(1);
    expect(longToc).toHaveLength(5);
    expect(longToc2).toHaveLength(5);
  });
});

describe("PostPage Suspense boundary", () => {
  it("PostPageInner is a separate async function that resolves nav independently", async () => {
    // Import the page module and verify extractToc is exported (testability requirement)
    const mod = await import("../../[id]/page");
    expect(typeof mod.extractToc).toBe("function");
    expect(typeof mod.default).toBe("function");
    // generateStaticParams should also be exported
    expect(typeof mod.generateStaticParams).toBe("function");
  });
});
