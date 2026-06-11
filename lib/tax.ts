/**
 * Self-employment tax ESTIMATOR. Transparent, jurisdiction-configurable, and
 * computed entirely locally (air-gap safe). These are simplified estimates with
 * fixed tax-year assumptions — not tax advice and not a substitute for filing.
 *
 * All money is integer minor units (pence/cents). Tax-year thresholds are written
 * in major units for readability and converted internally.
 */

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

export function estimateTax(
  jurisdiction: TaxJurisdiction,
  taxableProfitMinor: number,
): TaxEstimate {
  const profit = Math.max(0, taxableProfitMinor) / 100;
  const { incomeTax, secondary, secondaryLabel } =
    jurisdiction === "US" ? estimateUS(profit) : estimateUK(profit);
  const taxYear = jurisdiction === "US" ? US.taxYear : UK.taxYear;

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

export const TAX_YEAR_LABEL: Record<TaxJurisdiction, string> = {
  UK: UK.taxYear,
  US: US.taxYear,
};
