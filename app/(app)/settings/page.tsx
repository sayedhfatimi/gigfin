"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChargingCard } from "@/components/settings/charging-card";
import { VehiclesCard } from "@/components/settings/vehicles-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const CURRENCIES = ["GBP", "USD", "EUR", "CAD", "AUD", "NZD", "INR", "SGD"];

type SettingsForm = {
  currency: string;
  unitSystem: "metric" | "imperial";
  volumeUnit: "litre" | "gallon";
  odometerUnit: "km" | "mi";
  taxJurisdiction: "UK" | "US";
};

const DEFAULTS: SettingsForm = {
  currency: "GBP",
  unitSystem: "metric",
  volumeUnit: "litre",
  odometerUnit: "km",
  taxJurisdiction: "UK",
};

export default function SettingsPage() {
  const profile = useQuery(api.profiles.getMine);
  const update = useMutation(api.profiles.updateSettings);
  const [form, setForm] = useState<SettingsForm>(DEFAULTS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        currency: profile.currency,
        unitSystem: profile.unitSystem,
        volumeUnit: profile.volumeUnit,
        odometerUnit: profile.odometerUnit,
        taxJurisdiction: profile.taxJurisdiction,
      });
    }
  }, [profile]);

  async function save() {
    setBusy(true);
    try {
      await update(form);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Currency, units and tax preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            These drive how amounts, distances and tax are shown.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              className={selectClass}
              value={form.currency}
              onChange={(e) =>
                setForm((f) => ({ ...f, currency: e.target.value }))
              }
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="unitSystem">Unit system</Label>
            <select
              id="unitSystem"
              className={selectClass}
              value={form.unitSystem}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  unitSystem: e.target.value as SettingsForm["unitSystem"],
                }))
              }
            >
              <option value="metric">Metric</option>
              <option value="imperial">Imperial</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="volumeUnit">Fuel volume</Label>
            <select
              id="volumeUnit"
              className={selectClass}
              value={form.volumeUnit}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  volumeUnit: e.target.value as SettingsForm["volumeUnit"],
                }))
              }
            >
              <option value="litre">Litre</option>
              <option value="gallon">Gallon</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="odometerUnit">Odometer unit</Label>
            <select
              id="odometerUnit"
              className={selectClass}
              value={form.odometerUnit}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  odometerUnit: e.target.value as SettingsForm["odometerUnit"],
                }))
              }
            >
              <option value="km">Kilometres</option>
              <option value="mi">Miles</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="taxJurisdiction">Tax jurisdiction</Label>
            <select
              id="taxJurisdiction"
              className={selectClass}
              value={form.taxJurisdiction}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  taxJurisdiction: e.target
                    .value as SettingsForm["taxJurisdiction"],
                }))
              }
            >
              <option value="UK">United Kingdom</option>
              <option value="US">United States</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button onClick={save} disabled={busy || !profile}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <VehiclesCard />
      <ChargingCard currency={form.currency} />
    </div>
  );
}
