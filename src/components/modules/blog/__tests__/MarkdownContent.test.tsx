// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownContent } from "../MarkdownContent";

describe("MarkdownContent", () => {
  it("renders (empty) for empty source", () => {
    render(<MarkdownContent source="" />);
    expect(screen.getByText("(empty)")).toBeInTheDocument();
  });

  it("renders h1 for # heading markdown", () => {
    const { container } = render(<MarkdownContent source="# My Heading" />);
    const h1 = container.querySelector("h1");
    expect(h1).toBeInTheDocument();
    expect(h1?.textContent).toContain("My Heading");
  });

  it("rehype-slug adds id with md- prefix to headings", () => {
    const { container } = render(<MarkdownContent source="# Hello World" />);
    const h1 = container.querySelector("h1");
    expect(h1?.id).toBe("md-hello-world");
  });

  it("renders code fence with language class (rehype-highlight)", () => {
    const { container } = render(
      <MarkdownContent source={"```foo\nconst x = 1;\n```"} />,
    );
    // rehype-highlight adds language-foo class to the code element
    const code = container.querySelector("code.language-foo");
    expect(code).toBeInTheDocument();
  });

  it("highlights typescript code fence with hljs classes", () => {
    const { container } = render(
      <MarkdownContent
        source={"```typescript\nconst x: number = 1;\n```"}
      />,
    );
    const code = container.querySelector("code.language-typescript");
    expect(code).toBeInTheDocument();
    // rehype-highlight adds hljs class when language is registered
    expect(code?.classList.contains("hljs")).toBe(true);
  });

  it("falls back to plain text for unregistered language (brainfuck)", () => {
    const { container } = render(
      <MarkdownContent source={"```brainfuck\n++++++++\n```"} />,
    );
    // Code element exists with the language class — no throw, graceful fallback
    const code = container.querySelector("code.language-brainfuck");
    expect(code).toBeInTheDocument();
    // No hljs syntax-highlight spans inside — plain text content only
    expect(code?.querySelectorAll(".hljs-keyword, .hljs-string, .hljs-number").length).toBe(0);
  });

  it("renders GFM table (remark-gfm)", () => {
    const tableMarkdown = `
| A | B |
|---|---|
| 1 | 2 |
`;
    const { container } = render(<MarkdownContent source={tableMarkdown} />);
    expect(container.querySelector("table")).toBeInTheDocument();
    expect(container.querySelector("th")).toBeInTheDocument();
    expect(container.querySelector("td")).toBeInTheDocument();
  });
});
