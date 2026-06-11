"use client";

import { useMutation } from "convex/react";
import { DatabaseZap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import {
  EXPENSE_TYPES,
  UNIT_RATE_UNITS,
  VEHICLE_TYPES,
} from "@/convex/lib/constants";

type ExpenseType = (typeof EXPENSE_TYPES)[number];
type VehicleType = (typeof VEHICLE_TYPES)[number];
type UnitRateUnit = (typeof UNIT_RATE_UNITS)[number];

const EXP = new Set<string>(EXPENSE_TYPES);
const VEH = new Set<string>(VEHICLE_TYPES);
const UNIT = new Set<string>(UNIT_RATE_UNITS);

export function MigrateDialog() {
  const importMine = useMutation(api.migrate.importMine);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function onMigrate() {
    if (!file) {
      toast.error("Choose your v1 db.sqlite file.");
      return;
    }
    setBusy(true);
    try {
      const initSqlJs = (await import("sql.js")).default;
      const SQL = await initSqlJs({ locateFile: () => "/sql-wasm.wasm" });
      const db = new SQL.Database(new Uint8Array(await file.arrayBuffer()));

      const rows = (sql: string): Record<string, unknown>[] => {
        try {
          const res = db.exec(sql);
          if (res.length === 0) return [];
          const { columns, values } = res[0];
          return values.map((row) =>
            Object.fromEntries(columns.map((c, i) => [c, row[i]])),
          );
        } catch {
          return [];
        }
      };

      const vehicles = rows(
        "SELECT id, label, vehicle_type, is_default FROM vehicle_profiles",
      )
        .filter((r) => VEH.has(String(r.vehicle_type)))
        .map((r) => ({
          oldId: String(r.id),
          label: String(r.label),
          vehicleType: String(r.vehicle_type) as VehicleType,
          isDefault: Boolean(r.is_default),
        }));

      const income = rows("SELECT platform, amount, date FROM income").map(
        (r) => ({
          platform: String(r.platform),
          amountMinor: Math.round((Number(r.amount) || 0) * 100),
          date: String(r.date),
        }),
      );

      const expenses = rows(
        "SELECT expense_type, amount_minor, paid_at, vehicle_profile_id, notes, unit_rate_minor, unit_rate_unit FROM expenses",
      )
        .filter((r) => EXP.has(String(r.expense_type)))
        .map((r) => ({
          expenseType: String(r.expense_type) as ExpenseType,
          amountMinor: Number(r.amount_minor),
          date: String(r.paid_at),
          oldVehicleId: r.vehicle_profile_id
            ? String(r.vehicle_profile_id)
            : undefined,
          notes: r.notes ? String(r.notes) : undefined,
          unitRateMinor:
            r.unit_rate_minor != null ? Number(r.unit_rate_minor) : undefined,
          unitRateUnit:
            r.unit_rate_unit && UNIT.has(String(r.unit_rate_unit))
              ? (String(r.unit_rate_unit) as UnitRateUnit)
              : undefined,
        }));

      const odometers = rows(
        "SELECT date, start_reading, end_reading, vehicle_profile_id, notes FROM odometers",
      ).map((r) => ({
        date: String(r.date),
        startReading: Number(r.start_reading),
        endReading: Number(r.end_reading),
        oldVehicleId: r.vehicle_profile_id
          ? String(r.vehicle_profile_id)
          : undefined,
        notes: r.notes ? String(r.notes) : undefined,
      }));

      const charging = rows(
        "SELECT label, unit_rate_minor, unit_rate_unit FROM charging_vendors",
      )
        .filter((r) => UNIT.has(String(r.unit_rate_unit)))
        .map((r) => ({
          label: String(r.label),
          unitRateMinor: Number(r.unit_rate_minor),
          unitRateUnit: String(r.unit_rate_unit) as UnitRateUnit,
        }));

      db.close();

      if (income.length + expenses.length + vehicles.length === 0) {
        toast.error("No GigFin v1 data found in that file.");
        return;
      }

      const res = await importMine({
        vehicles,
        income,
        expenses,
        odometers,
        charging,
      });
      toast.success(
        `Imported ${res.income} income, ${res.expenses} expenses, ${res.odometers} mileage, ${res.vehicles} vehicles.`,
      );
      setOpen(false);
      setFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Migration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setFile(null);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <DatabaseZap className="size-4" />
            Migrate from GigFin v1
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Migrate from GigFin v1</DialogTitle>
          <DialogDescription>
            Upload your old <code>db.sqlite</code>. Income, expenses, mileage,
            vehicles and charging vendors are imported into this account. The
            file is read locally in your browser — nothing is uploaded anywhere.
            Accounts and preferences don&apos;t carry over.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="v1-file">v1 database file</Label>
          <input
            id="v1-file"
            type="file"
            accept=".sqlite,.db,application/x-sqlite3,application/vnd.sqlite3"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-muted-foreground text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-secondary file:px-3 file:py-1.5 file:font-medium file:text-secondary-foreground file:text-sm"
          />
        </div>
        <DialogFooter>
          <Button onClick={onMigrate} disabled={busy || !file}>
            {busy ? "Migrating…" : "Migrate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
