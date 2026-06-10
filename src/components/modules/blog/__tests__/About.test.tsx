// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { About } from "../About";
import { DEFAULT_ABOUT } from "@/services/contentService";

vi.mock("@/components/layout/Nav", () => ({
  Nav: () => <nav />,
}));
vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer />,
}));
vi.mock("@/components/modules/mobile/Chrome", () => ({
  MobileHeader: () => null,
  MobileFooter: () => null,
}));

afterEach(() => {
  cleanup();
});

describe("About paragraph backtick rendering", () => {
  it("renders plain paragraph text without icode span", () => {
    render(
      <About
        headline="Test"
        paragraphs={["Simple plain text paragraph."]}
        now={[]}
        stack={[]}
        contact={[]}
      />,
    );
    expect(screen.getByText("Simple plain text paragraph.")).toBeInTheDocument();
    expect(document.querySelector(".icode")).toBeNull();
  });

  it("renders backtick segment as <span className='icode'>", () => {
    render(
      <About
        headline="Test"
        paragraphs={["Before `inline code` after."]}
        now={[]}
        stack={[]}
        contact={[]}
      />,
    );
    const icode = document.querySelector(".icode");
    expect(icode).not.toBeNull();
    expect(icode!.textContent).toBe("inline code");
  });

  it("DEFAULT_ABOUT first paragraph contains icode span for backtick segment", () => {
    render(<About />);
    const icodes = document.querySelectorAll(".icode");
    // The default paragraph contains `10 things you didn't know`
    const found = Array.from(icodes).some((el) =>
      el.textContent?.includes("10 things you didn't know"),
    );
    expect(found).toBe(true);
  });

  it("renders headline prop", () => {
    render(<About headline="Custom Headline" paragraphs={[]} now={[]} stack={[]} contact={[]} />);
    expect(screen.getByText("Custom Headline")).toBeInTheDocument();
  });

  it("uses DEFAULT_ABOUT values when no props given", () => {
    render(<About />);
    expect(screen.getByText(DEFAULT_ABOUT.headline)).toBeInTheDocument();
  });
});
