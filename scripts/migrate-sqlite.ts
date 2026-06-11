/**
 * One-time SQLite → Convex migration for an existing GigFin (v1) instance.
 *
 * Usage:
 *   1. Sign up in the new app; note your user id (Settings shows it, or query
 *      api.auth.getCurrentUser).
 *   2. Set a migration secret on the backend:
 *        bunx convex env set MIGRATION_SECRET "$(openssl rand -hex 16)"
 *   3. Run (CONVEX_SELF_HOSTED_URL + ADMIN_KEY come from .env.local):
 *        SQLITE_PATH=~/db.sqlite \
 *        MIGRATION_USER_ID=<your-user-id> \
 *        MIGRATION_SECRET=<same-secret> \
 *        bun scripts/migrate-sqlite.ts
 */
import { Database } from "bun:sqlite";
import { $ } from "bun";

type Row = Record<string, unknown>;

const dbPath = process.env.SQLITE_PATH ?? `${process.env.HOME}/db.sqlite`;
const userId = process.env.MIGRATION_USER_ID;
const secret = process.env.MIGRATION_SECRET;

if (!userId)
  throw new Error("Set MIGRATION_USER_ID (your user id in the new app)");
if (!secret)
  throw new Error("Set MIGRATION_SECRET (must match the backend env var)");

const db = new Database(dbPath, { readonly: true });
const all = (sql: string) => db.query(sql).all() as Row[];

const vehicles = all(
  "SELECT id, label, vehicle_type, is_default FROM vehicle_profiles",
).map((r) => ({
  oldId: String(r.id),
  label: String(r.label),
  vehicleType: String(r.vehicle_type),
  isDefault: Boolean(r.is_default),
}));

const income = all("SELECT platform, amount, date FROM income").map((r) => ({
  platform: String(r.platform),
  amountMinor: Math.round((Number(r.amount) || 0) * 100),
  date: String(r.date),
}));

const expenses = all(
  "SELECT expense_type, amount_minor, paid_at, vehicle_profile_id, notes, unit_rate_minor, unit_rate_unit FROM expenses",
).map((r) => ({
  expenseType: String(r.expense_type),
  amountMinor: Number(r.amount_minor),
  date: String(r.paid_at),
  oldVehicleId: r.vehicle_profile_id ? String(r.vehicle_profile_id) : undefined,
  notes: r.notes ? String(r.notes) : undefined,
  unitRateMinor:
    r.unit_rate_minor != null ? Number(r.unit_rate_minor) : undefined,
  unitRateUnit: r.unit_rate_unit ? String(r.unit_rate_unit) : undefined,
}));

const odometers = all(
  "SELECT date, start_reading, end_reading, vehicle_profile_id, notes FROM odometers",
).map((r) => ({
  date: String(r.date),
  startReading: Number(r.start_reading),
  endReading: Number(r.end_reading),
  oldVehicleId: r.vehicle_profile_id ? String(r.vehicle_profile_id) : undefined,
  notes: r.notes ? String(r.notes) : undefined,
}));

const charging = all(
  "SELECT label, unit_rate_minor, unit_rate_unit FROM charging_vendors",
).map((r) => ({
  label: String(r.label),
  unitRateMinor: Number(r.unit_rate_minor),
  unitRateUnit: String(r.unit_rate_unit),
}));

db.close();

console.log(
  `Read ${vehicles.length} vehicles, ${income.length} income, ${expenses.length} expenses, ${odometers.length} odometers, ${charging.length} charging vendors.`,
);

const payload = JSON.stringify({
  secret,
  userId,
  vehicles,
  income,
  expenses,
  odometers,
  charging,
});

console.log("Importing into Convex…");
await $`bunx convex run migrate:importForUser ${payload}`;
console.log("Done.");
