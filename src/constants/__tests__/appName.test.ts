import { describe, it, expect } from "vitest";
import { APP_NAME, APP_DESCRIPTION } from "@/constants";

describe("APP_NAME", () => {
  it("is Notypiedev", () => {
    expect(APP_NAME).toBe("Notypiedev");
  });

  it("APP_DESCRIPTION references Notypiedev", () => {
    expect(APP_DESCRIPTION).toContain("Notypiedev");
  });
});
