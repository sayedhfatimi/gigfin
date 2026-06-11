"use client";

import { useMutation, useQuery } from "convex/react";
import { Star, Trash2 } from "lucide-react";
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
import { VEHICLE_TYPES } from "@/convex/lib/constants";
import { titleCase } from "@/lib/format";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function VehiclesCard() {
  const rows = useQuery(api.vehicles.list);
  const add = useMutation(api.vehicles.add);
  const update = useMutation(api.vehicles.update);
  const remove = useMutation(api.vehicles.remove);

  const [label, setLabel] = useState("");
  const [vehicleType, setVehicleType] = useState<
    (typeof VEHICLE_TYPES)[number]
  >(VEHICLE_TYPES[0]);
  const [isDefault, setIsDefault] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Enter a label.");
      return;
    }
    try {
      await add({ label: label.trim(), vehicleType, isDefault });
      setLabel("");
      setIsDefault(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicles</CardTitle>
        <CardDescription>
          Used to attribute expenses, mileage and charging.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
          <Input
            className="w-44"
            placeholder="Label (e.g. Tesla Model 3)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <select
            className={selectClass}
            value={vehicleType}
            onChange={(e) =>
              setVehicleType(e.target.value as (typeof VEHICLE_TYPES)[number])
            }
          >
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            Default
          </label>
          <Button type="submit">Add</Button>
        </form>

        {rows === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No vehicles yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {rows.map((v) => (
              <li
                key={v._id}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{v.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {titleCase(v.vehicleType)}
                  </span>
                  {v.isDefault && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary text-xs">
                      Default
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    onClick={() =>
                      remove({ id: v._id }).catch(() =>
                        toast.error("Failed to delete"),
                      )
                    }
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
