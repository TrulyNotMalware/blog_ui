import { describe, it, expect } from "vitest";
import nextConfig from "../../next.config";

describe("next.config optimizePackageImports", () => {
  it("includes @tanstack/react-query in optimizePackageImports", () => {
    expect(nextConfig.experimental?.optimizePackageImports).toContain(
      "@tanstack/react-query",
    );
  });

  it("includes @tanstack/react-query-devtools in optimizePackageImports", () => {
    expect(nextConfig.experimental?.optimizePackageImports).toContain(
      "@tanstack/react-query-devtools",
    );
  });
});
