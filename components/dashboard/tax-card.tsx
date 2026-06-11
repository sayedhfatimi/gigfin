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
  estimateTax,
  mileageAllowanceMinor,
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
  yearNetMinor,
  yearMiles,
}: {
  jurisdiction: TaxJurisdiction;
  currency: string;
  yearNetMinor: number;
  yearMiles: number;
}) {
  const profit = Math.max(0, yearNetMinor);
  const est = estimateTax(jurisdiction, profit);
  const mileage = mileageAllowanceMinor(jurisdiction, yearMiles);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax estimate</CardTitle>
        <CardDescription>
          {jurisdiction} · {est.taxYear} · on {formatMoney(profit, currency)}{" "}
          taxable profit
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
        {mileage > 0 && (
          <p className="pt-2 text-muted-foreground text-xs">
            Mileage allowance on {Math.round(yearMiles).toLocaleString()} mi:{" "}
            {formatMoney(mileage, currency)} (alternative to vehicle expenses).
          </p>
        )}
        <p className="text-muted-foreground text-xs">
          Simplified estimate — not tax advice.
        </p>
      </CardContent>
    </Card>
  );
}
