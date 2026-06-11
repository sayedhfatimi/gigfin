"use client";

import { useMutation, useQuery } from "convex/react";
import { Star, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { AddDialog } from "@/components/add-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import { VEHICLE_TYPES } from "@/convex/lib/constants";

const typeLabel = (t: (typeof VEHICLE_TYPES)[number]) =>
  t === "EV" ? "EV" : t[0] + t.slice(1).toLowerCase();
const TYPE_OPTIONS = VEHICLE_TYPES.map((t) => ({
  value: t,
  label: typeLabel(t),
}));

export function VehiclesCard() {
  const rows = useQuery(api.vehicles.list);
  const update = useMutation(api.vehicles.update);
  const remove = useMutation(api.vehicles.remove);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Vehicles</CardTitle>
            <CardDescription>
              Used to attribute expenses, mileage and charging.
            </CardDescription>
          </div>
          <AddDialog title="Add vehicle">
            {(close) => <VehicleForm onDone={close} />}
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
          <p className="text-muted-foreground text-sm">No vehicles yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {rows.map((v) => (
              <li
                key={v._id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium text-sm">
                    {v.label}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
                    {typeLabel(v.vehicleType)}
                  </span>
                  {v.isDefault && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary text-xs">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!v.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Make default"
                      title="Make default"
                      onClick={() =>
                        update({
                          id: v._id,
                          label: v.label,
                          vehicleType: v.vehicleType,
                          isDefault: true,
                        }).catch(() => toast.error("Failed to update"))
                      }
                    >
                      <Star className="size-4 text-muted-foreground" />
                    </Button>
                  )}
                  <ConfirmDialog
                    title="Delete this vehicle?"
                    description="Expenses, mileage and shifts linked to it will be unlinked."
                    confirmLabel="Delete"
                    onConfirm={() =>
                      remove({ id: v._id }).catch(() =>
                        toast.error("Failed to delete"),
                      )
                    }
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Delete">
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function VehicleForm({ onDone }: { onDone: () => void }) {
  const add = useMutation(api.vehicles.add);
  const [label, setLabel] = useState("");
  const [vehicleType, setVehicleType] = useState<
    (typeof VEHICLE_TYPES)[number]
  >(VEHICLE_TYPES[0]);
  const [isDefault, setIsDefault] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Enter a label.");
      return;
    }
    setBusy(true);
    try {
      await add({ label: label.trim(), vehicleType, isDefault });
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
        <Label htmlFor="vehicle-label">Label</Label>
        <Input
          id="vehicle-label"
          placeholder="e.g. Tesla Model 3"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="vehicle-type">Type</Label>
        <SelectField
          id="vehicle-type"
          value={vehicleType}
          onValueChange={(v) =>
            setVehicleType(v as (typeof VEHICLE_TYPES)[number])
          }
          options={TYPE_OPTIONS}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
        />
        Set as default
      </label>
      <DialogFooter>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Add vehicle"}
        </Button>
      </DialogFooter>
    </form>
  );
}
