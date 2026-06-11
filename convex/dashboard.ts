import { z } from "zod";
import { authedQuery } from "./lib/functions";

const sum = <T>(rows: T[], pick: (row: T) => number) =>
  rows.reduce((acc, row) => acc + pick(row), 0);

// Reactive dashboard aggregation. Computes all-time totals plus year-scoped
// breakdowns (by month / platform / category) and business distance. The client
// passes the calendar year so the query stays deterministic.
export const summary = authedQuery({
  args: { year: z.number().int() },
  handler: async (ctx, { year }) => {
    const yr = String(year);
    const inYear = (date: string) => date.startsWith(`${yr}-`);

    const [incomes, expenses, odometers, shifts] = await Promise.all([
      ctx.db
        .query("income")
        .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
        .collect(),
      ctx.db
        .query("expenses")
        .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
        .collect(),
      ctx.db
        .query("odometers")
        .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
        .collect(),
      ctx.db
        .query("shifts")
        .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
        .collect(),
    ]);

    const totalIncomeMinor = sum(incomes, (i) => i.amountMinor);
    const totalExpenseMinor = sum(expenses, (e) => e.amountMinor);

    const yearIncomes = incomes.filter((i) => inYear(i.date));
    const yearExpenses = expenses.filter((e) => inYear(e.date));
    const yearIncomeMinor = sum(yearIncomes, (i) => i.amountMinor);
    const yearExpenseMinor = sum(yearExpenses, (e) => e.amountMinor);

    const byMonth = Array.from({ length: 12 }, (_, m) => {
      const prefix = `${yr}-${String(m + 1).padStart(2, "0")}`;
      return {
        month: m + 1,
        incomeMinor: sum(
          yearIncomes.filter((i) => i.date.startsWith(prefix)),
          (i) => i.amountMinor,
        ),
        expenseMinor: sum(
          yearExpenses.filter((e) => e.date.startsWith(prefix)),
          (e) => e.amountMinor,
        ),
      };
    });

    const platformMap = new Map<string, number>();
    for (const i of yearIncomes) {
      platformMap.set(
        i.platform,
        (platformMap.get(i.platform) ?? 0) + i.amountMinor,
      );
    }
    const byPlatform = [...platformMap.entries()]
      .map(([platform, amountMinor]) => ({ platform, amountMinor }))
      .sort((a, b) => b.amountMinor - a.amountMinor);

    const categoryMap = new Map<string, number>();
    for (const e of yearExpenses) {
      categoryMap.set(
        e.expenseType,
        (categoryMap.get(e.expenseType) ?? 0) + e.amountMinor,
      );
    }
    const byCategory = [...categoryMap.entries()]
      .map(([expenseType, amountMinor]) => ({ expenseType, amountMinor }))
      .sort((a, b) => b.amountMinor - a.amountMinor);

    const yearDistance = sum(
      odometers.filter((o) => inYear(o.date)),
      (o) => Math.max(0, (o.endReading ?? o.startReading) - o.startReading),
    );

    const yearMinutes = sum(
      shifts.filter((s) => inYear(s.date)),
      (s) => s.durationMin ?? 0,
    );

    return {
      year,
      totalIncomeMinor,
      totalExpenseMinor,
      netMinor: totalIncomeMinor - totalExpenseMinor,
      yearIncomeMinor,
      yearExpenseMinor,
      yearNetMinor: yearIncomeMinor - yearExpenseMinor,
      yearDistance,
      yearMinutes,
      byMonth,
      byPlatform,
      byCategory,
    };
  },
});
