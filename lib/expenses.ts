import {
  formatMonthLabel,
  type MonthlyIncomeSummary,
  type MonthOption,
} from '@/lib/income';
import type { VehicleType } from './vehicle';

export type UnitRateUnit = 'kwh' | 'litre' | 'gallon_us' | 'gallon_imp';

export type ExpenseVehicle = {
  id: string;
  label?: string;
  vehicleType?: VehicleType;
};

export type ExpenseEntry = {
  id: string;
  userId: string;
  expenseType: string;
  amountMinor: number;
  paidAt: string;
  unitRateMinor: number | null;
  unitRateUnit: UnitRateUnit | null;
  notes: string | null;
  vehicleProfileId: string | null;
  vehicle: ExpenseVehicle | null;
  detailsJson: string | null;
  createdAt: string;
  updatedAt: string;
};

export const expenseTypeOptions = [
  { value: 'fuel_charging', label: 'Fuel / Charging' },
  { value: 'maintenance', label: 'Maintenance / Servicing' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'tyres', label: 'Tyres' },
  { value: 'cleaning', label: 'Cleaning / Car wash' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'road_tax', label: 'Road tax / registration' },
  { value: 'mot', label: 'MOT / inspections' },
  { value: 'parking', label: 'Parking (paid)' },
  { value: 'tolls', label: 'Tolls / bridges / ferries' },
  { value: 'congestion', label: 'Congestion / clean-air charges' },
  { value: 'phone', label: 'Phone / data' },
  {
    value: 'equipment',
    label: 'Equipment (mounts, cables, power banks, bags)',
  },
  {
    value: 'platform_fees',
    label: 'Platform fees / subscriptions / cashout fees',
  },
  { value: 'fines', label: 'Fines / penalties' },
  { value: 'finance', label: 'Finance / lease / loan interest' },
  { value: 'depreciation', label: 'Depreciation / vehicle purchase' },
];

const monthFromDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
  };
};

const expenseTypeLabelMap = new Map(
  expenseTypeOptions.map((option) => [option.value, option.label]),
);

export const formatExpenseType = (value: string) =>
  expenseTypeLabelMap.get(value) ?? value;

export const getExpenseEntryMonth = (entry: ExpenseEntry) =>
  monthFromDate(entry.paidAt);

export const buildExpenseMonthOptions = (
  entries: ExpenseEntry[],
): MonthOption[] => {
  const map = new Map<string, MonthOption>();
  entries.forEach((entry) => {
    const parsed = getExpenseEntryMonth(entry);
    if (!parsed) {
      return;
    }
    const key = `${parsed.year}-${parsed.month}`;
    if (map.has(key)) {
      return;
    }
    map.set(key, {
      key,
      label: formatMonthLabel(parsed.year, parsed.month),
      year: parsed.year,
      month: parsed.month,
    });
  });
  return Array.from(map.values()).sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.month - a.month;
  });
};

export const getCurrentMonthExpenses = (
  entries: ExpenseEntry[],
  reference = new Date(),
) => {
  const refYear = reference.getFullYear();
  const refMonth = reference.getMonth();
  return entries.filter((entry) => {
    const parsed = getExpenseEntryMonth(entry);
    if (!parsed) {
      return false;
    }
    return parsed.year === refYear && parsed.month === refMonth;
  });
};

export const getYearlyMonthlyExpenseTotals = (
  entries: ExpenseEntry[],
  reference = new Date(),
): MonthlyIncomeSummary[] => {
  const year = reference.getFullYear();
  const totals = new Map<number, number>();
  entries.forEach((entry) => {
    const parsed = getExpenseEntryMonth(entry);
    if (!parsed || parsed.year !== year) {
      return;
    }
    totals.set(
      parsed.month,
      (totals.get(parsed.month) ?? 0) + entry.amountMinor / 100,
    );
  });

  const result: MonthlyIncomeSummary[] = [];
  for (let month = 0; month < 12; month += 1) {
    result.push({
      label: formatMonthLabel(year, month),
      year,
      month,
      total: totals.get(month) ?? 0,
    });
  }
  return result;
};
