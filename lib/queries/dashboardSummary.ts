import { useQuery } from '@tanstack/react-query';

export interface DashboardSummary {
  // Totals
  totalIncome: number;
  totalExpense: number;
  trackedDays: number;
  averagePerDay: number;

  // Today
  todayIncome: number;
  todayExpense: number;
  todayNet: number;
  todayIncomeCount: number;
  todayExpenseCount: number;

  // Yesterday
  yesterdayIncome: number;
  yesterdayExpense: number;
  yesterdayNet: number;

  // Current month
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  monthIncomeCount: number;
  monthExpenseCount: number;

  // Current week
  weekIncome: number;

  // Profit metrics
  profitMargin: number | null;
  expenseRatio: number | null;

  // Platform breakdown
  platformDistribution: Array<{
    platform: string;
    amount: number;
    count: number;
    percentage: number;
  }>;

  // Timestamps
  computedAt: string;
}

async function fetchDashboardSummary(
  timeframe: string,
): Promise<DashboardSummary> {
  const response = await fetch(
    `/api/dashboard/summary?timeframe=${encodeURIComponent(timeframe)}`,
  );
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard summary');
  }
  return response.json();
}

export function useDashboardSummary(timeframe = 'monthly') {
  return useQuery({
    queryKey: ['dashboardSummary', timeframe],
    queryFn: () => fetchDashboardSummary(timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
