import { describe, expect, it } from "vitest";
import { dashboardLayoutSchema } from "./dashboard-layout";

describe("dashboardLayoutSchema", () => {
  it("accepts a full layout", () => {
    const out = dashboardLayoutSchema.parse({
      order: ["stats", "todaySnapshot"],
      hidden: ["fuelMpg"],
      timeframe: "monthly",
    });
    expect(out.order).toEqual(["stats", "todaySnapshot"]);
    expect(out.hidden).toEqual(["fuelMpg"]);
    expect(out.timeframe).toBe("monthly");
  });

  it("treats timeframe as optional", () => {
    const out = dashboardLayoutSchema.parse({ order: [], hidden: [] });
    expect(out.timeframe).toBeUndefined();
  });

  it("rejects non-array order/hidden", () => {
    expect(() =>
      dashboardLayoutSchema.parse({ order: "stats", hidden: [] }),
    ).toThrow();
    expect(() =>
      dashboardLayoutSchema.parse({ order: [], hidden: 3 }),
    ).toThrow();
  });
});
