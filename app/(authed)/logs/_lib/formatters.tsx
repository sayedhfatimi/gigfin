import type { Column } from '@tanstack/react-table';

import type { ExpenseEntry } from '@/lib/expenses';
import type {
  DailyIncomeSummary,
  IncomeEntry,
  MonthOption,
} from '@/lib/income';
import { formatMonthLabel, getEntryMonth } from '@/lib/income';

export const buildEntryMonthOptions = (
  entries: IncomeEntry[],
): MonthOption[] => {
  const map = new Map<string, MonthOption>();
  entries.forEach((entry) => {
    const parsed = getEntryMonth(entry);
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

export const renderSortableHeader = (
  column: Column<DailyIncomeSummary>,
  label: string,
  align: 'left' | 'right' = 'left',
) => {
  const alignmentClasses =
    align === 'right' ? 'justify-end text-right' : 'justify-start text-left';
  return (
    <button
      type='button'
      className={`flex w-full items-center gap-2 text-xs font-semibold uppercase ${alignmentClasses}`}
      onClick={() => column.toggleSorting()}
    >
      <span className='text-base-content'>{label}</span>
      <span
        aria-hidden='true'
        className={`fa-solid ${
          column.getIsSorted() === 'asc'
            ? 'fa-arrow-up'
            : column.getIsSorted() === 'desc'
              ? 'fa-arrow-down'
              : 'fa-arrows-up-down'
        } text-[0.6rem] text-base-content/60`}
      />
    </button>
  );
};

export const formatDateLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatExpenseRate = (entry: ExpenseEntry) => {
  if (!entry.unitRateMinor || !entry.unitRateUnit) {
    return '—';
  }
  const unitLabel =
    entry.unitRateUnit === 'kwh'
      ? 'kWh'
      : entry.unitRateUnit === 'litre'
        ? 'litre'
        : entry.unitRateUnit === 'gallon_us'
          ? 'gallon (US)'
          : entry.unitRateUnit === 'gallon_imp'
            ? 'gallon (Imperial)'
            : entry.unitRateUnit;
  return `${entry.unitRateMinor}p/${unitLabel}`;
};
