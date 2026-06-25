import { z } from "zod";
import {
  categoryDistribution,
  monthlyExpenseMinor,
  sumExpenseMinor,
} from "../lib/expenses-agg";
import {
  monthlyIncomeMinor,
  platformDistribution,
  sumIncomeMinor,
} from "../lib/income";
import { totalDistance } from "../lib/odometer";
import { authedQuery } from "./lib/functions";

// Reactive reports aggregation for one calendar year: year totals plus
// breakdowns (by month / platform / category) and business distance. Queries are
// bounded to the year via the by_user_date index rather than scanning all
// history (the all-time totals this used to return were unused). The client
// passes the calendar year so the query stays deterministic.
export const summary = authedQuery({
  args: { year: z.number().int() },
  handler: async (ctx, { year }) => {
    const yr = String(year);
    const start = `${yr}-01-01`;
    const end = `${yr}-12-31`;

    const [yearIncomes, yearExpenses, odometers, shifts] = await Promise.all([
      ctx.db
        .query("income")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", ctx.userId).gte("date", start).lte("date", end),
        )
        .collect(),
      ctx.db
        .query("expenses")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", ctx.userId).gte("date", start).lte("date", end),
        )
        .collect(),
      ctx.db
        .query("odometers")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", ctx.userId).gte("date", start).lte("date", end),
        )
        .collect(),
      ctx.db
        .query("shifts")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", ctx.userId).gte("date", start).lte("date", end),
        )
        .collect(),
    ]);

    // Aggregations reuse the shared pure functions in lib/ so the reports page
    // and the dashboard widgets compute these figures from one implementation.
    const yearIncomeMinor = sumIncomeMinor(yearIncomes);
    const yearExpenseMinor = sumExpenseMinor(yearExpenses);

    const incomeByMonth = monthlyIncomeMinor(yearIncomes, year);
    const expenseByMonth = monthlyExpenseMinor(yearExpenses, year);
    const byMonth = Array.from({ length: 12 }, (_, m) => ({
      month: m + 1,
      incomeMinor: incomeByMonth[m],
      expenseMinor: expenseByMonth[m],
    }));

    const byPlatform = platformDistribution(yearIncomes);
    const byCategory = categoryDistribution(yearExpenses);
    const yearDistance = totalDistance(odometers);
    const yearMinutes = shifts.reduce(
      (acc, s) => acc + (s.durationMin ?? 0),
      0,
    );

    return {
      year,
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
