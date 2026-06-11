// Display helpers. Money is stored as integer minor units everywhere; convert
// only at these boundaries.

export function formatMoney(
  minor: number,
  currency = "GBP",
  locale = "en-GB",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(minor / 100);
}

// Parse a user-typed major-unit amount (e.g. "41.50") into integer minor units.
// Returns null if it isn't a finite number.
export function parseMoneyToMinor(input: string): number | null {
  const n = Number.parseFloat(input.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function formatDate(iso: string, locale = "en-GB"): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// "fuel_charging" -> "Fuel charging"
export function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
