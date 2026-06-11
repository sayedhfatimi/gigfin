// Pure odometer/distance helpers. Reimplemented from gigfin-old/lib/odometer.ts;
// v2 uses the unit value `'mi'` (not `'miles'`) and tolerates an open reading
// (no `endReading` yet) by treating its distance as 0.

export type DistanceUnit = "km" | "mi";

const KM_PER_MILE = 1.60934;

export type OdometerRow = { startReading: number; endReading?: number };

// Distance covered by one reading; 0 while the reading is still open.
export function distanceOf(row: OdometerRow): number {
  if (row.endReading === undefined) return 0;
  return Math.max(0, row.endReading - row.startReading);
}

export function totalDistance(rows: readonly OdometerRow[]): number {
  return rows.reduce((acc, r) => acc + distanceOf(r), 0);
}

// Convert a distance expressed in the user's odometer unit into miles, for the
// mileage-allowance / per-mile calculations (which are mile-based).
export function toMiles(distance: number, unit: DistanceUnit): number {
  return unit === "mi" ? distance : distance / KM_PER_MILE;
}

export function formatDistance(distance: number, unit: DistanceUnit): string {
  return `${distance.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  })} ${unit}`;
}
