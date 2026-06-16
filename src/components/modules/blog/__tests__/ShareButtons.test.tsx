// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { ShareButtons } from "../ShareButtons";

afterEach(() => {
  cleanup();
});

describe("ShareButtons", () => {
  it("does not render a Hacker News button", () => {
    render(<ShareButtons postId="test-post" />);
    expect(screen.queryByText("Hacker News")).toBeNull();
  });

  it("renders the Copy link button and copies URL on click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "location", {
      value: { origin: "https://example.com" },
      writable: true,
      configurable: true,
    });

    render(<ShareButtons postId="test-post" />);

    const btn = screen.getByRole("button", { name: /copy link/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("https://example.com/posts/test-post");
    });

    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });
  });
});
