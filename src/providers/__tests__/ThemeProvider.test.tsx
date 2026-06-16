// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider } from "../ThemeProvider";

// Capture props forwarded to NextThemesProvider without exercising next-themes internals.
const capturedProps: Record<string, unknown>[] = [];

vi.mock("next-themes", () => ({
  ThemeProvider: (props: Record<string, unknown>) => {
    capturedProps.push(props);
    return <>{props.children}</>;
  },
}));

describe("ThemeProvider prop contract", () => {
  it("forwards defaultTheme='system' so OS preference is respected by default", () => {
    capturedProps.length = 0;
    render(
      <ThemeProvider>
        <span>content</span>
      </ThemeProvider>
    );
    expect(capturedProps).toHaveLength(1);
    expect(capturedProps[0].defaultTheme).toBe("system");
  });

  it("forwards enableSystem=true so prefers-color-scheme resolves light/dark", () => {
    capturedProps.length = 0;
    render(
      <ThemeProvider>
        <span>content</span>
      </ThemeProvider>
    );
    expect(capturedProps[0].enableSystem).toBe(true);
  });

  it("forwards attribute='data-theme'", () => {
    capturedProps.length = 0;
    render(
      <ThemeProvider>
        <span />
      </ThemeProvider>
    );
    expect(capturedProps[0].attribute).toBe("data-theme");
  });

  it("forwards storageKey='notypiedev-theme'", () => {
    capturedProps.length = 0;
    render(
      <ThemeProvider>
        <span />
      </ThemeProvider>
    );
    expect(capturedProps[0].storageKey).toBe("notypiedev-theme");
  });
});
