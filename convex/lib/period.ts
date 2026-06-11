// Start (ISO YYYY-MM-DD, UTC) of the current period containing `today`.
// weekly = Monday of this week; monthly = 1st of this month; custom = the
// goal's own start date.
export function periodStart(
  period: "weekly" | "monthly" | "custom",
  today: string,
  customStart?: string,
): string {
  if (period === "custom") return customStart ?? today;
  const [y, m, d] = today.split("-").map(Number);
  if (period === "monthly") {
    return `${y}-${String(m).padStart(2, "0")}-01`;
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  const daysSinceMonday = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - daysSinceMonday);
  return dt.toISOString().slice(0, 10);
}
