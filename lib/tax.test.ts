import { describe, expect, it } from "vitest";
import { estimateTax, mileageAllowanceMinor } from "./tax";

describe("estimateTax — UK", () => {
  it("taxes basic-rate profit with income tax + Class 4 NIC", () => {
    // £30,000 profit: income tax (30000-12570)*20% = £3,486;
    // NIC (30000-12570)*6% = £1,045.80
    const e = estimateTax("UK", 3_000_000);
    expect(e.incomeTaxMinor).toBe(348_600);
    expect(e.secondaryTaxMinor).toBe(104_580);
    expect(e.totalTaxMinor).toBe(453_180);
    expect(e.secondaryLabel).toBe("National Insurance");
  });

  it("charges nothing below the personal allowance", () => {
    const e = estimateTax("UK", 1_000_000); // £10,000
    expect(e.incomeTaxMinor).toBe(0);
    expect(e.secondaryTaxMinor).toBe(0);
    expect(e.totalTaxMinor).toBe(0);
  });

  it("applies higher-rate band above £50,270", () => {
    // £60,000: taxable 47,430 → 37,700@20% + 9,730@40% = £11,432
    // NIC: 37,700@6% + 9,730@2% = £2,456.60
    const e = estimateTax("UK", 6_000_000);
    expect(e.incomeTaxMinor).toBe(1_143_200);
    expect(e.secondaryTaxMinor).toBe(245_660);
  });

  it("never reports a negative effective rate at zero profit", () => {
    const e = estimateTax("UK", 0);
    expect(e.totalTaxMinor).toBe(0);
    expect(e.effectiveRate).toBe(0);
  });
});

describe("estimateTax — US", () => {
  it("includes self-employment tax", () => {
    const e = estimateTax("US", 5_000_000); // $50,000
    expect(e.secondaryLabel).toBe("Self-employment tax");
    // SE tax = 50000*0.9235*0.153 = $7,064.78 → 706478 minor
    expect(e.secondaryTaxMinor).toBe(706_478);
    expect(e.incomeTaxMinor).toBeGreaterThan(0);
    expect(e.totalTaxMinor).toBe(e.incomeTaxMinor + e.secondaryTaxMinor);
  });
});

describe("mileageAllowanceMinor", () => {
  it("applies UK tiered AMAP rates", () => {
    // 12,000 miles: 10,000@45p + 2,000@25p = £5,000
    expect(mileageAllowanceMinor("UK", 12_000)).toBe(500_000);
    expect(mileageAllowanceMinor("UK", 5_000)).toBe(225_000);
  });

  it("applies the US flat IRS rate", () => {
    expect(mileageAllowanceMinor("US", 1_000)).toBe(67_000);
  });

  it("returns zero for no miles", () => {
    expect(mileageAllowanceMinor("UK", 0)).toBe(0);
  });
});
