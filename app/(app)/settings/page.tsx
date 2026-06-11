"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SelectField } from "@/components/select-field";
import { ChargingCard } from "@/components/settings/charging-card";
import { RecurringCard } from "@/components/settings/recurring-card";
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

const CURRENCY_OPTIONS = [
  "GBP",
  "USD",
  "EUR",
  "CAD",
  "AUD",
  "NZD",
  "INR",
  "SGD",
].map((c) => ({ value: c, label: c }));
const UNIT_SYSTEM_OPTIONS = [
  { value: "metric", label: "Metric" },
  { value: "imperial", label: "Imperial" },
];
const VOLUME_OPTIONS = [
  { value: "litre", label: "Litre" },
  { value: "gallon", label: "Gallon" },
];
const ODOMETER_OPTIONS = [
  { value: "km", label: "Kilometres" },
  { value: "mi", label: "Miles" },
];
const JURISDICTION_OPTIONS = [
  { value: "UK", label: "United Kingdom" },
  { value: "US", label: "United States" },
];

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

  function set<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

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
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <SelectField
                id="currency"
                value={form.currency}
                onValueChange={(v) => set("currency", v)}
                options={CURRENCY_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unitSystem">Unit system</Label>
              <SelectField
                id="unitSystem"
                value={form.unitSystem}
                onValueChange={(v) =>
                  set("unitSystem", v as SettingsForm["unitSystem"])
                }
                options={UNIT_SYSTEM_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="volumeUnit">Fuel volume</Label>
              <SelectField
                id="volumeUnit"
                value={form.volumeUnit}
                onValueChange={(v) =>
                  set("volumeUnit", v as SettingsForm["volumeUnit"])
                }
                options={VOLUME_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="odometerUnit">Odometer unit</Label>
              <SelectField
                id="odometerUnit"
                value={form.odometerUnit}
                onValueChange={(v) =>
                  set("odometerUnit", v as SettingsForm["odometerUnit"])
                }
                options={ODOMETER_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxJurisdiction">Tax jurisdiction</Label>
              <SelectField
                id="taxJurisdiction"
                value={form.taxJurisdiction}
                onValueChange={(v) =>
                  set("taxJurisdiction", v as SettingsForm["taxJurisdiction"])
                }
                options={JURISDICTION_OPTIONS}
              />
            </div>
          </div>
          <div>
            <Button onClick={save} disabled={busy || !profile}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <VehiclesCard />
      <RecurringCard currency={form.currency} />
      <ChargingCard currency={form.currency} />
    </div>
  );
}
