import { db } from '@/db';
import { expense, income } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const url = new URL(request.url);
  const _timeframe = url.searchParams.get('timeframe') ?? 'monthly';

  // Calculate date ranges based on timeframe
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const _yearStart = new Date(now.getFullYear(), 0, 1);

  // Get week start (Monday)
  const weekStart = new Date(todayStart);
  const day = weekStart.getDay();
  const offset = (day + 6) % 7;
  weekStart.setDate(weekStart.getDate() - offset);

  try {
    // Fetch all income and expense summaries in parallel
    const [
      totalIncomeResult,
      totalExpenseResult,
      todayIncomeResult,
      todayExpenseResult,
      yesterdayIncomeResult,
      yesterdayExpenseResult,
      monthIncomeResult,
      monthExpenseResult,
      weekIncomeResult,
      platformBreakdownResult,
      incomeCountResult,
      _expenseCountResult,
    ] = await Promise.all([
      // Total income
      db
        .select({
          total: sql<number>`COALESCE(SUM(${income.amount}), 0)`.as('total'),
        })
        .from(income)
        .where(eq(income.userId, userId)),

      // Total expenses
      db
        .select({
          total: sql<number>`COALESCE(SUM(${expense.amountMinor}), 0)`.as(
            'total',
          ),
        })
        .from(expense)
        .where(eq(expense.userId, userId)),

      // Today's income
      db
        .select({
          total: sql<number>`COALESCE(SUM(${income.amount}), 0)`.as('total'),
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(income)
        .where(
          and(
            eq(income.userId, userId),
            gte(income.date, todayStart.toISOString().split('T')[0]),
            lte(income.date, todayEnd.toISOString().split('T')[0]),
          ),
        ),

      // Today's expenses
      db
        .select({
          total: sql<number>`COALESCE(SUM(${expense.amountMinor}), 0)`.as(
            'total',
          ),
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(expense)
        .where(
          and(
            eq(expense.userId, userId),
            gte(expense.paidAt, todayStart.toISOString().split('T')[0]),
            lte(expense.paidAt, todayEnd.toISOString().split('T')[0]),
          ),
        ),

      // Yesterday's income
      db
        .select({
          total: sql<number>`COALESCE(SUM(${income.amount}), 0)`.as('total'),
        })
        .from(income)
        .where(
          and(
            eq(income.userId, userId),
            gte(income.date, yesterdayStart.toISOString().split('T')[0]),
            lte(income.date, yesterdayEnd.toISOString().split('T')[0]),
          ),
        ),

      // Yesterday's expenses
      db
        .select({
          total: sql<number>`COALESCE(SUM(${expense.amountMinor}), 0)`.as(
            'total',
          ),
        })
        .from(expense)
        .where(
          and(
            eq(expense.userId, userId),
            gte(expense.paidAt, yesterdayStart.toISOString().split('T')[0]),
            lte(expense.paidAt, yesterdayEnd.toISOString().split('T')[0]),
          ),
        ),

      // Current month income
      db
        .select({
          total: sql<number>`COALESCE(SUM(${income.amount}), 0)`.as('total'),
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(income)
        .where(
          and(
            eq(income.userId, userId),
            gte(income.date, monthStart.toISOString().split('T')[0]),
          ),
        ),

      // Current month expenses
      db
        .select({
          total: sql<number>`COALESCE(SUM(${expense.amountMinor}), 0)`.as(
            'total',
          ),
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(expense)
        .where(
          and(
            eq(expense.userId, userId),
            gte(expense.paidAt, monthStart.toISOString().split('T')[0]),
          ),
        ),

      // Current week income
      db
        .select({
          total: sql<number>`COALESCE(SUM(${income.amount}), 0)`.as('total'),
        })
        .from(income)
        .where(
          and(
            eq(income.userId, userId),
            gte(income.date, weekStart.toISOString().split('T')[0]),
          ),
        ),

      // Platform breakdown for current month
      db
        .select({
          platform: income.platform,
          total: sql<number>`COALESCE(SUM(${income.amount}), 0)`.as('total'),
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(income)
        .where(
          and(
            eq(income.userId, userId),
            gte(income.date, monthStart.toISOString().split('T')[0]),
          ),
        )
        .groupBy(income.platform)
        .orderBy(sql`total DESC`),

      // Total income entry count
      db
        .select({
          count: sql<number>`COUNT(DISTINCT ${income.date})`.as('count'),
        })
        .from(income)
        .where(eq(income.userId, userId)),

      // Total expense entry count
      db
        .select({
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(expense)
        .where(eq(expense.userId, userId)),
    ]);

    const totalIncome = totalIncomeResult[0]?.total ?? 0;
    const totalExpenseMinor = totalExpenseResult[0]?.total ?? 0;
    const trackedDays = incomeCountResult[0]?.count ?? 0;

    const todayIncome = todayIncomeResult[0]?.total ?? 0;
    const todayExpenseMinor = todayExpenseResult[0]?.total ?? 0;
    const todayIncomeCount = todayIncomeResult[0]?.count ?? 0;
    const todayExpenseCount = todayExpenseResult[0]?.count ?? 0;

    const yesterdayIncome = yesterdayIncomeResult[0]?.total ?? 0;
    const yesterdayExpenseMinor = yesterdayExpenseResult[0]?.total ?? 0;

    const monthIncome = monthIncomeResult[0]?.total ?? 0;
    const monthExpenseMinor = monthExpenseResult[0]?.total ?? 0;
    const monthIncomeCount = monthIncomeResult[0]?.count ?? 0;
    const monthExpenseCount = monthExpenseResult[0]?.count ?? 0;

    const weekIncome = weekIncomeResult[0]?.total ?? 0;

    // Calculate derived metrics
    const todayExpense = todayExpenseMinor / 100;
    const yesterdayExpense = yesterdayExpenseMinor / 100;
    const monthExpense = monthExpenseMinor / 100;
    const totalExpense = totalExpenseMinor / 100;

    const todayNet = todayIncome - todayExpense;
    const yesterdayNet = yesterdayIncome - yesterdayExpense;
    const monthNet = monthIncome - monthExpense;
    const averagePerDay = trackedDays > 0 ? totalIncome / trackedDays : 0;
    const profitMargin = monthIncome > 0 ? monthNet / monthIncome : null;
    const expenseRatio = monthIncome > 0 ? monthExpense / monthIncome : null;

    // Format platform breakdown
    const platformDistribution = platformBreakdownResult.map((row) => ({
      platform: row.platform,
      amount: row.total,
      count: row.count,
      percentage: monthIncome > 0 ? row.total / monthIncome : 0,
    }));

    return NextResponse.json({
      // Totals
      totalIncome,
      totalExpense,
      trackedDays,
      averagePerDay,

      // Today
      todayIncome,
      todayExpense,
      todayNet,
      todayIncomeCount,
      todayExpenseCount,

      // Yesterday
      yesterdayIncome,
      yesterdayExpense,
      yesterdayNet,

      // Current month
      monthIncome,
      monthExpense,
      monthNet,
      monthIncomeCount,
      monthExpenseCount,

      // Current week
      weekIncome,

      // Profit metrics
      profitMargin,
      expenseRatio,

      // Platform breakdown
      platformDistribution,

      // Timestamps
      computedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json(
      { error: 'Failed to compute dashboard summary' },
      { status: 500 },
    );
  }
}
