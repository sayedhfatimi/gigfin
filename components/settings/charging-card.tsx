"use client";

import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { AddDialog } from "@/components/add-dialog";
import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { UNIT_RATE_UNITS } from "@/convex/lib/constants";
import { formatMoney, parseMoneyToMinor } from "@/lib/format";

const UNIT_LABELS: Record<(typeof UNIT_RATE_UNITS)[number], string> = {
  kwh: "kWh",
  litre: "litre",
  gallon_us: "gallon (US)",
  gallon_imp: "gallon (imp)",
};
const UNIT_OPTIONS = UNIT_RATE_UNITS.map((u) => ({
  value: u,
  label: `per ${UNIT_LABELS[u]}`,
}));

export function ChargingCard({ currency }: { currency: string }) {
  const rows = useQuery(api.chargingVendors.list);
  const remove = useMutation(api.chargingVendors.remove);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Charging vendors</CardTitle>
            <CardDescription>
              Saved unit rates for estimating EV charging costs.
            </CardDescription>
          </div>
          <AddDialog title="Add charging vendor">
            {(close) => <ChargingForm onDone={close} />}
          </AddDialog>
        </div>
      </CardHeader>
      <CardContent>
        {rows === undefined ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No vendors yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {rows.map((vendor) => (
              <li
                key={vendor._id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-medium">{vendor.label}</span>{" "}
                  <span className="text-muted-foreground">
                    {formatMoney(vendor.unitRateMinor, currency)} per{" "}
                    {UNIT_LABELS[vendor.unitRateUnit]}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete"
                  onClick={() =>
                    remove({ id: vendor._id }).catch(() =>
                      toast.error("Failed to delete"),
                    )
                  }
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ChargingForm({ onDone }: { onDone: () => void }) {
  const add = useMutation(api.chargingVendors.add);
  const [label, setLabel] = useState("");
  const [rate, setRate] = useState("");
  const [unit, setUnit] = useState<(typeof UNIT_RATE_UNITS)[number]>(
    UNIT_RATE_UNITS[0],
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const unitRateMinor = parseMoneyToMinor(rate);
    if (!label.trim() || unitRateMinor === null) {
      toast.error("Enter a label and rate.");
      return;
    }
    setBusy(true);
    try {
      await add({ label: label.trim(), unitRateMinor, unitRateUnit: unit });
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="vendor-label">Label</Label>
        <Input
          id="vendor-label"
          placeholder="e.g. Home, Ionity"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="vendor-rate">Rate</Label>
          <Input
            id="vendor-rate"
            inputMode="decimal"
            placeholder="0.00"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vendor-unit">Unit</Label>
          <SelectField
            id="vendor-unit"
            value={unit}
            onValueChange={(v) =>
              setUnit(v as (typeof UNIT_RATE_UNITS)[number])
            }
            options={UNIT_OPTIONS}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Add vendor"}
        </Button>
      </DialogFooter>
    </form>
  );
}
