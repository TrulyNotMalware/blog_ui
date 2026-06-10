// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
// Mock the (client) component imports so the page module loads in a node env.
vi.mock("@/components/layout/ResponsiveSwitch", () => ({ ResponsiveSwitch: () => null }));
vi.mock("@/components/modules/blog/Tags", () => ({ Tags: () => null }));
vi.mock("@/components/modules/mobile/Mobile", () => ({ MobileTags: () => null }));
vi.mock("@/services/tagService", () => ({
  tagService: { list: vi.fn(), detail: vi.fn() },
}));

import { generateStaticParams } from "../page";
import { tagService } from "@/services/tagService";

describe("tags/[name] generateStaticParams", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps tag names to params when the API responds", async () => {
    vi.mocked(tagService.list).mockResolvedValue([
      { name: "infra", count: 2 },
      { name: "nextjs", count: 1 },
    ] as never);

    await expect(generateStaticParams()).resolves.toEqual([
      { name: "infra" },
      { name: "nextjs" },
    ]);
  });

  it("returns [] when the API is unreachable at build time (does not throw)", async () => {
    vi.mocked(tagService.list).mockRejectedValue(new Error("ECONNREFUSED"));

    // Must resolve to [] so the production build never fails on a transient API outage.
    await expect(generateStaticParams()).resolves.toEqual([]);
  });
});
