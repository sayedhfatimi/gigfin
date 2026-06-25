import type { RecurringCadence } from "./constants";

// Advance an ISO date (YYYY-MM-DD) by one cadence period, in UTC calendar terms.
// Month/quarter/year steps clamp the day to the last valid day of the target
// month, so a schedule dated on the 29th-31st never overflows into the
// following month (e.g. Jan 31 + monthly -> Feb 28/29, not Mar 3).
export function advance(dateStr: string, cadence: RecurringCadence): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (cadence === "weekly") return addDays(y, m - 1, d, 7);
  if (cadence === "biweekly") return addDays(y, m - 1, d, 14);
  if (cadence === "monthly") return addMonths(y, m - 1, d, 1);
  if (cadence === "quarterly") return addMonths(y, m - 1, d, 3);
  return addMonths(y, m - 1, d, 12); // yearly
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function addDays(y: number, m0: number, d: number, days: number): string {
  const dt = new Date(Date.UTC(y, m0, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

// Add `months` calendar months, clamping the resulting day to the last day of
// the target month (no overflow). `m0` is a 0-based month index.
function addMonths(y: number, m0: number, d: number, months: number): string {
  const total = m0 + months;
  const ny = y + Math.floor(total / 12);
  const nm0 = ((total % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(ny, nm0 + 1, 0)).getUTCDate();
  const nd = Math.min(d, lastDay);
  return `${ny}-${pad(nm0 + 1)}-${pad(nd)}`;
}
