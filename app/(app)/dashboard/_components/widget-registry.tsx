import type { WidgetMeta } from "./widget-types";
import { BudgetsWidget } from "./widgets/budgets-widget";
import { DailyCadenceWidget } from "./widgets/daily-cadence-widget";
import { DrivingStatsWidget } from "./widgets/driving-stats-widget";
import { ExpenseCategoryWidget } from "./widgets/expense-category-widget";
import { ExpenseOverviewWidget } from "./widgets/expense-overview-widget";
import { GoalsWidget } from "./widgets/goals-widget";
import { HoursShiftsWidget } from "./widgets/hours-shifts-widget";
import { IncomePerMileTrendWidget } from "./widgets/income-per-mile-trend-widget";
import { IncomePerMileWidget } from "./widgets/income-per-mile-widget";
import { IncomeTrendWidget } from "./widgets/income-trend-widget";
import { IncomeVsExpensesWidget } from "./widgets/income-vs-expenses-widget";
import { MileageDeductionWidget } from "./widgets/mileage-deduction-widget";
import { PlatformBreakdownWidget } from "./widgets/platform-breakdown-widget";
import { PlatformConcentrationWidget } from "./widgets/platform-concentration-widget";
import { ProfitabilityWidget } from "./widgets/profitability-widget";
import { RecentDaysWidget } from "./widgets/recent-days-widget";
import { RunningCostWidget } from "./widgets/running-cost-widget";
import { StatsWidget } from "./widgets/stats-widget";
import { TaxWidget } from "./widgets/tax-widget";
import { TodaySnapshotWidget } from "./widgets/today-snapshot-widget";
import { TotalsTableWidget } from "./widgets/totals-table-widget";
import { YearlyRunRateWidget } from "./widgets/yearly-run-rate-widget";

// The canonical widget set + default order. Widget ids are stable strings stored
// in the user's saved layout. Pinned widgets render above the sortable grid;
// defaultHidden widgets start in the tray.
export const WIDGETS: WidgetMeta[] = [
  {
    id: "todaySnapshot",
    label: "Today's snapshot",
    description: "Today's net so far, vs yesterday.",
    timeframeMode: "fixed",
    pinned: true,
    component: TodaySnapshotWidget,
  },
  {
    id: "stats",
    label: "Summary",
    description: "Income, expenses, net and hourly rate for the timeframe.",
    timeframeMode: "global",
    pinned: true,
    component: StatsWidget,
  },
  {
    id: "incomeVsExpenses",
    label: "Income vs expenses",
    description: "Monthly bars for the current year.",
    timeframeMode: "fixed",
    widthClass: "lg:col-span-2",
    component: IncomeVsExpensesWidget,
  },
  {
    id: "tax",
    label: "Tax estimate",
    description: "Estimated tax for the current tax year.",
    timeframeMode: "fixed",
    component: TaxWidget,
  },
  {
    id: "incomeTrend",
    label: "Income trend",
    description: "Daily income over the timeframe.",
    timeframeMode: "global",
    widthClass: "lg:col-span-2",
    component: IncomeTrendWidget,
  },
  {
    id: "profitability",
    label: "Profitability",
    description: "Gross, expenses, net and margin for the timeframe.",
    timeframeMode: "global",
    component: ProfitabilityWidget,
  },
  {
    id: "platformBreakdown",
    label: "Income by platform",
    description: "Per-platform income for the timeframe.",
    timeframeMode: "global",
    component: PlatformBreakdownWidget,
  },
  {
    id: "expenseCategory",
    label: "Expenses by category",
    description: "Per-category spend for the timeframe.",
    timeframeMode: "global",
    component: ExpenseCategoryWidget,
  },
  {
    id: "goals",
    label: "Goals",
    description: "Progress against your income & savings goals.",
    timeframeMode: "fixed",
    component: GoalsWidget,
  },
  {
    id: "budgets",
    label: "Budgets",
    description: "Spend against your budget limits.",
    timeframeMode: "fixed",
    component: BudgetsWidget,
  },
  {
    id: "incomePerMile",
    label: "Income per mile",
    description: "Income earned per business mile.",
    timeframeMode: "global",
    defaultHidden: true,
    component: IncomePerMileWidget,
  },
  {
    id: "incomePerMileTrend",
    label: "Income per mile trend",
    description: "Income earned per business mile over the timeframe.",
    timeframeMode: "global",
    widthClass: "lg:col-span-2",
    defaultHidden: true,
    component: IncomePerMileTrendWidget,
  },
  {
    id: "runningCost",
    label: "Running cost",
    description: "Fuel/charging spend per mile.",
    timeframeMode: "global",
    defaultHidden: true,
    component: RunningCostWidget,
  },
  {
    id: "drivingStats",
    label: "Driving",
    description: "Distance, trips and active vehicles.",
    timeframeMode: "global",
    defaultHidden: true,
    component: DrivingStatsWidget,
  },
  {
    id: "hoursShifts",
    label: "Hours & shifts",
    description: "Hours worked, shifts and average length.",
    timeframeMode: "global",
    defaultHidden: true,
    component: HoursShiftsWidget,
  },
  {
    id: "expenseOverview",
    label: "Expense overview",
    description: "Total spend, count and biggest category.",
    timeframeMode: "global",
    defaultHidden: true,
    component: ExpenseOverviewWidget,
  },
  {
    id: "platformConcentration",
    label: "Platform concentration",
    description: "Largest single-platform share of income.",
    timeframeMode: "global",
    defaultHidden: true,
    component: PlatformConcentrationWidget,
  },
  {
    id: "yearlyRunRate",
    label: "Yearly run-rate",
    description: "Net annualised from the year so far.",
    timeframeMode: "fixed",
    defaultHidden: true,
    component: YearlyRunRateWidget,
  },
  {
    id: "mileageDeduction",
    label: "Mileage deduction",
    description: "Tax-year mileage allowance.",
    timeframeMode: "fixed",
    defaultHidden: true,
    component: MileageDeductionWidget,
  },
  {
    id: "recentDays",
    label: "Recent days",
    description: "Net per day for the last 7 days.",
    timeframeMode: "fixed",
    defaultHidden: true,
    component: RecentDaysWidget,
  },
  {
    id: "totalsTable",
    label: "Recent entries",
    description: "Latest income and expense entries.",
    timeframeMode: "global",
    widthClass: "lg:col-span-2",
    defaultHidden: true,
    component: TotalsTableWidget,
  },
  {
    id: "dailyCadence",
    label: "Daily cadence",
    description: "Income heatmap for the last 12 weeks.",
    timeframeMode: "fixed",
    widthClass: "lg:col-span-2",
    defaultHidden: true,
    component: DailyCadenceWidget,
  },
];
