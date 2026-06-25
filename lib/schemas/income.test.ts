import { describe, expect, it } from "vitest";
import { incomeSchema } from "./income";

describe("incomeSchema", () => {
  it("accepts a well-formed entry and trims the platform", () => {
    const r = incomeSchema.safeParse({
      platform: "  Uber  ",
      amountMinor: 4150,
      date: "2025-06-01",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.platform).toBe("Uber");
  });

  it("rejects an empty platform", () => {
    const r = incomeSchema.safeParse({
      platform: "   ",
      amountMinor: 100,
      date: "2025-06-01",
    });
    expect(r.success).toBe(false);
  });

  it("rejects a non-integer or negative amount", () => {
    expect(
      incomeSchema.safeParse({
        platform: "Uber",
        amountMinor: 10.5,
        date: "2025-06-01",
      }).success,
    ).toBe(false);
    expect(
      incomeSchema.safeParse({
        platform: "Uber",
        amountMinor: -1,
        date: "2025-06-01",
      }).success,
    ).toBe(false);
  });

  it("rejects a malformed date", () => {
    expect(
      incomeSchema.safeParse({
        platform: "Uber",
        amountMinor: 100,
        date: "01/06/2025",
      }).success,
    ).toBe(false);
  });
});
