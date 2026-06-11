"use client";

import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { UNIT_RATE_UNITS } from "@/convex/lib/constants";
import { formatMoney, parseMoneyToMinor } from "@/lib/format";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ChargingCard({ currency }: { currency: string }) {
  const rows = useQuery(api.chargingVendors.list);
  const add = useMutation(api.chargingVendors.add);
  const remove = useMutation(api.chargingVendors.remove);

  const [label, setLabel] = useState("");
  const [rate, setRate] = useState("");
  const [unit, setUnit] = useState<(typeof UNIT_RATE_UNITS)[number]>(
    UNIT_RATE_UNITS[0],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const unitRateMinor = parseMoneyToMinor(rate);
    if (!label.trim() || unitRateMinor === null) {
      toast.error("Enter a label and rate.");
      return;
    }
    try {
      await add({ label: label.trim(), unitRateMinor, unitRateUnit: unit });
      setLabel("");
      setRate("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Charging vendors</CardTitle>
        <CardDescription>
          Saved unit rates for estimating EV charging costs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
          <Input
            className="w-44"
            placeholder="Label (e.g. Home, Ionity)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Input
            className="w-28"
            inputMode="decimal"
            placeholder="Rate"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
          <select
            className={selectClass}
            value={unit}
            onChange={(e) =>
              setUnit(e.target.value as (typeof UNIT_RATE_UNITS)[number])
            }
          >
            {UNIT_RATE_UNITS.map((u) => (
              <option key={u} value={u}>
                per {u}
              </option>
            ))}
          </select>
          <Button type="submit">Add</Button>
        </form>

        {rows === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No vendors yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {rows.map((vendor) => (
              <li
                key={vendor._id}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium">{vendor.label}</span>{" "}
                  <span className="text-muted-foreground">
                    {formatMoney(vendor.unitRateMinor, currency)} /{" "}
                    {vendor.unitRateUnit}
                  </span>
                </span>
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
