"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import {
  computeTaxableProfit,
  estimateTax,
  type TaxJurisdiction,
} from "@/lib/tax";

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={strong ? "font-medium" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={`tabular-nums ${strong ? "font-semibold" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export function TaxCard({
  jurisdiction,
  currency,
  year,
  incomeMinor,
  byCategory,
  miles,
}: {
  jurisdiction: TaxJurisdiction;
  currency: string;
  year: number;
  incomeMinor: number;
  byCategory: { expenseType: string; amountMinor: number }[];
  miles: number;
}) {
  const breakdown = computeTaxableProfit({
    jurisdiction,
    incomeMinor,
    byCategory,
    miles,
  });
  const est = estimateTax(jurisdiction, breakdown.taxableProfitMinor, year);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax estimate</CardTitle>
        <CardDescription>
          {jurisdiction} · {est.taxYear} · on{" "}
          {formatMoney(breakdown.taxableProfitMinor, currency)} taxable profit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Row
          label="Income tax"
          value={formatMoney(est.incomeTaxMinor, currency)}
        />
        <Row
          label={est.secondaryLabel}
          value={formatMoney(est.secondaryTaxMinor, currency)}
        />
        <div className="my-2 border-t" />
        <Row
          strong
          label="Estimated tax"
          value={formatMoney(est.totalTaxMinor, currency)}
        />
        <Row
          label={`Effective rate · take-home ${formatMoney(est.takeHomeMinor, currency)}`}
          value={`${(est.effectiveRate * 100).toFixed(1)}%`}
        />
        {breakdown.nonDeductibleMinor > 0 && (
          <Row
            label="Non-deductible (incl. fines)"
            value={`excluded ${formatMoney(breakdown.nonDeductibleMinor, currency)}`}
          />
        )}
        {breakdown.mileageAllowanceMinor > 0 && (
          <p className="pt-2 text-muted-foreground text-xs">
            Mileage allowance on {Math.round(miles).toLocaleString()} mi:{" "}
            {formatMoney(breakdown.mileageAllowanceMinor, currency)} —{" "}
            {breakdown.vehicleMethod === "mileage"
              ? "applied in place of actual vehicle costs."
              : "not applied; actual vehicle costs are more beneficial."}
          </p>
        )}
        <p className="text-muted-foreground text-xs">
          Simplified estimate — not tax advice.
        </p>
      </CardContent>
    </Card>
  );
}
