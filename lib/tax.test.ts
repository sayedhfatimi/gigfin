import { describe, expect, it } from "vitest";
import {
  computeTaxableProfit,
  estimateTax,
  mileageAllowanceMinor,
  taxYearLabel,
} from "./tax";

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

describe("computeTaxableProfit", () => {
  // The dataset behind the audited 2026 PDF report.
  const pdfCategories = [
    { expenseType: "insurance", amountMinor: 202_130 },
    { expenseType: "fuel_charging", amountMinor: 116_219 },
    { expenseType: "finance", amountMinor: 98_972 },
    { expenseType: "phone", amountMinor: 41_422 },
    { expenseType: "tyres", amountMinor: 40_600 },
    { expenseType: "fines", amountMinor: 16_000 },
    { expenseType: "mot", amountMinor: 5_485 },
    { expenseType: "platform_fees", amountMinor: 3_994 },
    { expenseType: "cleaning", amountMinor: 2_000 },
  ];

  it("excludes fines and uses actual vehicle costs when they beat mileage", () => {
    const bd = computeTaxableProfit({
      jurisdiction: "UK",
      incomeMinor: 740_468,
      byCategory: pdfCategories,
      miles: 5_635,
    });
    expect(bd.grossExpenseMinor).toBe(526_822);
    expect(bd.nonDeductibleMinor).toBe(16_000);
    expect(bd.vehicleActualMinor).toBe(463_406);
    expect(bd.mileageAllowanceMinor).toBe(253_575); // 5,635 mi @ 45p
    expect(bd.vehicleMethod).toBe("actual");
    expect(bd.vehicleDeductionMinor).toBe(463_406);
    expect(bd.allowableExpenseMinor).toBe(510_822);
    expect(bd.taxableProfitMinor).toBe(229_646);
  });

  it("swaps to the mileage allowance when it beats actual vehicle costs", () => {
    const bd = computeTaxableProfit({
      jurisdiction: "UK",
      incomeMinor: 5_000_000,
      byCategory: [
        { expenseType: "fuel_charging", amountMinor: 50_000 },
        { expenseType: "phone", amountMinor: 10_000 },
      ],
      miles: 12_000, // 10,000@45p + 2,000@25p = £5,000 = 500,000 minor
    });
    expect(bd.vehicleActualMinor).toBe(50_000);
    expect(bd.mileageAllowanceMinor).toBe(500_000);
    expect(bd.vehicleMethod).toBe("mileage");
    expect(bd.vehicleDeductionMinor).toBe(500_000);
    // other deductible (phone 10,000) + mileage 500,000
    expect(bd.allowableExpenseMinor).toBe(510_000);
    expect(bd.taxableProfitMinor).toBe(4_490_000);
  });

  it("never returns a negative taxable profit", () => {
    const bd = computeTaxableProfit({
      jurisdiction: "UK",
      incomeMinor: 10_000,
      byCategory: [{ expenseType: "insurance", amountMinor: 50_000 }],
      miles: 0,
    });
    expect(bd.taxableProfitMinor).toBe(0);
  });
});

describe("taxYearLabel", () => {
  it("maps a UK calendar year to the Apr–Apr tax year", () => {
    expect(taxYearLabel("UK", 2026)).toBe("2025/26");
    expect(taxYearLabel("UK", 2025)).toBe("2024/25");
  });

  it("uses the calendar year itself for the US", () => {
    expect(taxYearLabel("US", 2026)).toBe("2026");
  });
});

describe("estimateTax — derived tax-year label", () => {
  it("derives the label when a calendar year is supplied", () => {
    expect(estimateTax("UK", 3_000_000, 2026).taxYear).toBe("2025/26");
  });

  it("falls back to the fixed label when no year is supplied", () => {
    expect(estimateTax("UK", 3_000_000).taxYear).toBe("2024/25");
  });
});
