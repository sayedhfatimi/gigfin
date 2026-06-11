import type { WidgetMeta } from "./widget-types";
import { BudgetsWidget } from "./widgets/budgets-widget";
import { ExpenseCategoryWidget } from "./widgets/expense-category-widget";
import { GoalsWidget } from "./widgets/goals-widget";
import { IncomeVsExpensesWidget } from "./widgets/income-vs-expenses-widget";
import { PlatformBreakdownWidget } from "./widgets/platform-breakdown-widget";
import { StatsWidget } from "./widgets/stats-widget";
import { TaxWidget } from "./widgets/tax-widget";
import { TodaySnapshotWidget } from "./widgets/today-snapshot-widget";

// The canonical widget set + default order. Widget ids are stable strings stored
// in the user's saved layout. Pinned widgets render above the sortable grid.
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
];
