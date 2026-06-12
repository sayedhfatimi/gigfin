/**
 * Self-employment tax ESTIMATOR. Transparent, jurisdiction-configurable, and
 * computed entirely locally (air-gap safe). These are simplified estimates with
 * fixed tax-year assumptions — not tax advice and not a substitute for filing.
 *
 * All money is integer minor units (pence/cents). Tax-year thresholds are written
 * in major units for readability and converted internally.
 */

import {
  NON_DEDUCTIBLE_EXPENSE_TYPES,
  VEHICLE_COST_EXPENSE_TYPES,
} from "@/convex/lib/constants";

export type TaxJurisdiction = "UK" | "US";

export interface TaxEstimate {
  jurisdiction: TaxJurisdiction;
  taxYear: string;
  taxableProfitMinor: number;
  incomeTaxMinor: number;
  secondaryLabel: string;
  secondaryTaxMinor: number;
  totalTaxMinor: number;
  takeHomeMinor: number;
  /** total tax as a fraction (0–1) of taxable profit */
  effectiveRate: number;
}

const toMinor = (major: number) => Math.round(major * 100);

interface Band {
  width: number;
  rate: number;
}

// Progressive tax over successive bands (last band width = Infinity).
function progressive(amount: number, bands: Band[]): number {
  let remaining = Math.max(0, amount);
  let tax = 0;
  for (const band of bands) {
    if (remaining <= 0) break;
    const slice = Math.min(remaining, band.width);
    tax += slice * band.rate;
    remaining -= slice;
  }
  return tax;
}

// --- UK 2024/25 (rest-of-UK rates) ---
const UK = {
  taxYear: "2024/25",
  personalAllowance: 12570,
  taperThreshold: 100000,
  // applied to taxable income after the personal allowance
  incomeBands: [
    { width: 37700, rate: 0.2 },
    { width: 74870, rate: 0.4 }, // basic-rate limit up to £125,140
    { width: Number.POSITIVE_INFINITY, rate: 0.45 },
  ] satisfies Band[],
  // Class 4 NIC on profit above the personal allowance threshold
  nicBands: [
    { width: 37700, rate: 0.06 },
    { width: Number.POSITIVE_INFINITY, rate: 0.02 },
  ] satisfies Band[],
  mileageTiers: [
    { uptoMiles: 10000, ratePence: 45 },
    { uptoMiles: Number.POSITIVE_INFINITY, ratePence: 25 },
  ],
};

function estimateUK(profit: number) {
  const pa = Math.max(
    0,
    UK.personalAllowance - Math.max(0, profit - UK.taperThreshold) / 2,
  );
  const incomeTax = progressive(Math.max(0, profit - pa), UK.incomeBands);
  const nic = progressive(
    Math.max(0, profit - UK.personalAllowance),
    UK.nicBands,
  );
  return { incomeTax, secondary: nic, secondaryLabel: "National Insurance" };
}

// --- US 2024 (single filer, Schedule C) ---
const US = {
  taxYear: "2024",
  standardDeduction: 14600,
  incomeBands: [
    { width: 11600, rate: 0.1 },
    { width: 35550, rate: 0.12 },
    { width: 53375, rate: 0.22 },
    { width: 91425, rate: 0.24 },
    { width: 51775, rate: 0.32 },
    { width: 365625, rate: 0.35 },
    { width: Number.POSITIVE_INFINITY, rate: 0.37 },
  ] satisfies Band[],
  se: { base: 0.9235, ssCap: 168600, ssRate: 0.124, medicareRate: 0.029 },
  mileageRateCents: 67,
};

function estimateUS(profit: number) {
  const net = Math.max(0, profit) * US.se.base;
  const seTax =
    Math.min(net, US.se.ssCap) * US.se.ssRate + net * US.se.medicareRate;
  const taxableIncome = Math.max(0, profit - US.standardDeduction - seTax / 2);
  const incomeTax = progressive(taxableIncome, US.incomeBands);
  return { incomeTax, secondary: seTax, secondaryLabel: "Self-employment tax" };
}

// Label the relevant tax year for a calendar-year report. UK tax years run
// 6 Apr–5 Apr, so a calendar year maps to the tax year that began the previous
// April (e.g. 2026 → "2025/26"). US tax years are the calendar year itself.
export function taxYearLabel(
  jurisdiction: TaxJurisdiction,
  calendarYear: number,
): string {
  if (jurisdiction === "US") return String(calendarYear);
  return `${calendarYear - 1}/${String(calendarYear).slice(2)}`;
}

export function estimateTax(
  jurisdiction: TaxJurisdiction,
  taxableProfitMinor: number,
  calendarYear?: number,
): TaxEstimate {
  const profit = Math.max(0, taxableProfitMinor) / 100;
  const { incomeTax, secondary, secondaryLabel } =
    jurisdiction === "US" ? estimateUS(profit) : estimateUK(profit);
  const taxYear =
    calendarYear !== undefined
      ? taxYearLabel(jurisdiction, calendarYear)
      : jurisdiction === "US"
        ? US.taxYear
        : UK.taxYear;

  const incomeTaxMinor = toMinor(incomeTax);
  const secondaryTaxMinor = toMinor(secondary);
  const totalTaxMinor = incomeTaxMinor + secondaryTaxMinor;
  const safeProfit = Math.max(0, taxableProfitMinor);

  return {
    jurisdiction,
    taxYear,
    taxableProfitMinor: safeProfit,
    incomeTaxMinor,
    secondaryLabel,
    secondaryTaxMinor,
    totalTaxMinor,
    takeHomeMinor: safeProfit - totalTaxMinor,
    effectiveRate: safeProfit > 0 ? totalTaxMinor / safeProfit : 0,
  };
}

// Informational alternative deduction: approved mileage allowance for business
// miles. Returns minor units in the jurisdiction's currency.
export function mileageAllowanceMinor(
  jurisdiction: TaxJurisdiction,
  totalMiles: number,
): number {
  if (totalMiles <= 0) return 0;
  if (jurisdiction === "US") {
    return Math.round(totalMiles * US.mileageRateCents);
  }
  let remaining = totalMiles;
  let prevCap = 0;
  let pence = 0;
  for (const tier of UK.mileageTiers) {
    const miles = Math.min(remaining, tier.uptoMiles - prevCap);
    pence += miles * tier.ratePence;
    remaining -= miles;
    prevCap = tier.uptoMiles;
    if (remaining <= 0) break;
  }
  return Math.round(pence);
}

export interface TaxableProfitBreakdown {
  /** all expenses for the period, including non-deductible ones */
  grossExpenseMinor: number;
  /** HMRC-disallowed expenses (e.g. fines), never claimed */
  nonDeductibleMinor: number;
  /** sum of actual vehicle running costs */
  vehicleActualMinor: number;
  /** simplified mileage allowance for the period's business miles */
  mileageAllowanceMinor: number;
  /** the more beneficial vehicle method, auto-selected */
  vehicleMethod: "actual" | "mileage";
  /** the vehicle figure actually applied (actual costs or mileage allowance) */
  vehicleDeductionMinor: number;
  /** deductible expenses actually used to reduce profit */
  allowableExpenseMinor: number;
  /** income minus allowable expenses, floored at zero */
  taxableProfitMinor: number;
}

const NON_DEDUCTIBLE = new Set<string>(NON_DEDUCTIBLE_EXPENSE_TYPES);
const VEHICLE_COST = new Set<string>(VEHICLE_COST_EXPENSE_TYPES);

// Turn period income + category totals + business miles into a full taxable-profit
// breakdown. Excludes non-deductible categories (fines) and auto-selects whichever
// vehicle method — actual running costs vs the mileage allowance — yields the bigger
// deduction. All money is integer minor units.
export function computeTaxableProfit(input: {
  jurisdiction: TaxJurisdiction;
  incomeMinor: number;
  byCategory: { expenseType: string; amountMinor: number }[];
  miles: number;
}): TaxableProfitBreakdown {
  const { jurisdiction, incomeMinor, byCategory, miles } = input;

  let grossExpenseMinor = 0;
  let nonDeductibleMinor = 0;
  let vehicleActualMinor = 0;
  for (const { expenseType, amountMinor } of byCategory) {
    grossExpenseMinor += amountMinor;
    if (NON_DEDUCTIBLE.has(expenseType)) nonDeductibleMinor += amountMinor;
    else if (VEHICLE_COST.has(expenseType)) vehicleActualMinor += amountMinor;
  }
  // Deductible expenses that are neither vehicle running costs nor disallowed
  // (e.g. phone, parking, tolls) — always claimable regardless of vehicle method.
  const otherDeductibleMinor =
    grossExpenseMinor - nonDeductibleMinor - vehicleActualMinor;

  const mileage = mileageAllowanceMinor(jurisdiction, miles);
  const useActual = vehicleActualMinor >= mileage;
  const vehicleDeductionMinor = useActual ? vehicleActualMinor : mileage;
  const allowableExpenseMinor = otherDeductibleMinor + vehicleDeductionMinor;

  return {
    grossExpenseMinor,
    nonDeductibleMinor,
    vehicleActualMinor,
    mileageAllowanceMinor: mileage,
    vehicleMethod: useActual ? "actual" : "mileage",
    vehicleDeductionMinor,
    allowableExpenseMinor,
    taxableProfitMinor: Math.max(0, incomeMinor - allowableExpenseMinor),
  };
}
