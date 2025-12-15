'use client';

import type { Column, SortingState } from '@tanstack/react-table';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import type { CurrencyCode } from '@/lib/currency';
import { resolveCurrency } from '@/lib/currency';
import {
  buildExpenseMonthOptions,
  type ExpenseEntry,
  expenseTypeOptions,
  formatExpenseType,
  getExpenseEntryMonth,
  type UnitRateUnit,
} from '@/lib/expenses';
import {
  aggregateDailyIncomes,
  type DailyIncomeSummary,
  formatCurrency,
  formatMonthLabel,
  getEntryMonth,
  type IncomeEntry,
  type MonthOption,
} from '@/lib/income';
import type { ExpensePayload } from '@/lib/queries/expenses';
import {
  useAddExpense,
  useDeleteExpense,
  useExpenseLogs,
  useUpdateExpense,
} from '@/lib/queries/expenses';
import {
  useAddIncome,
  useDeleteIncome,
  useIncomeLogs,
  useUpdateIncome,
} from '@/lib/queries/income';
import { useVehicleProfiles } from '@/lib/queries/vehicleProfiles';
import { getSessionUser } from '@/lib/session';
import CombinedTransactionCard from './_components/CombinedTransactionCard';
import EntryActions from './_components/EntryActions';
import EntryModal from './_components/EntryModal';
import FilterPanel from './_components/FilterPanel';
import FilterRow from './_components/FilterRow';
import FilterSelect from './_components/FilterSelect';
import LoadingState from './_components/LoadingState';

const columnHelper = createColumnHelper<DailyIncomeSummary>();
const GRID_TEMPLATE_CLASS =
  'md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center';

const buildEntryMonthOptions = (entries: IncomeEntry[]): MonthOption[] => {
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

const renderSortableHeader = (
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

const buildColumns = (currency: CurrencyCode) => [
  columnHelper.accessor('date', {
    header: ({ column }) => renderSortableHeader(column, 'Date'),
    cell: (info) => (
      <div className='text-sm font-semibold text-base-content'>
        {info.getValue()}
      </div>
    ),
  }),
  columnHelper.accessor('total', {
    header: ({ column }) =>
      renderSortableHeader(column, 'Total income', 'right'),
    cell: (info) => (
      <div className='text-sm font-semibold text-base-content'>
        {formatCurrency(info.getValue(), currency)}
      </div>
    ),
    meta: {
      align: 'right',
    },
  }),
  columnHelper.accessor('breakdown', {
    header: 'Platforms',
    cell: (info) => (
      <div className='text-xs font-semibold uppercase  text-base-content/60'>
        {info
          .getValue()
          .map((row) => row.platform)
          .join(' · ')}
      </div>
    ),
  }),
];

const LOG_TABS: { label: string; key: View }[] = [
  { label: 'All', key: 'all' },
  { label: 'Income', key: 'income' },
  { label: 'Expenses', key: 'expenses' },
];

const formatDateLabel = (value: string) => {
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

const formatExpenseRate = (entry: ExpenseEntry) => {
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

type ExpenseSortColumn = 'date' | 'type' | 'amount';

type ExpenseSortState = null | {
  column: ExpenseSortColumn;
  direction: 'asc' | 'desc';
};

type EntryTab = 'income' | 'expense';

type View = 'all' | 'income' | 'expenses';

type CombinedTransaction =
  | { type: 'income'; entry: IncomeEntry; date: string }
  | { type: 'expense'; entry: ExpenseEntry; date: string };

type DeletableEntry = CombinedTransaction;

export default function LogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawView = searchParams.get('view');
  const view: View =
    rawView === 'income' || rawView === 'expenses' ? rawView : 'all';
  const handleSetView = (nextView: View) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', nextView);
    router.push(`/logs?${params.toString()}`);
  };

  const { data: sessionData } = useSession();
  const sessionUser = getSessionUser(sessionData);
  const currency = resolveCurrency(sessionUser?.currency);
  const volumeUnit = (sessionUser?.volumeUnit ?? 'litre') as UnitRateUnit;

  const { data: incomes = [], isLoading: isLoadingIncomes } = useIncomeLogs();
  const addIncomeMutation = useAddIncome();
  const updateIncomeMutation = useUpdateIncome();
  const deleteIncomeMutation = useDeleteIncome();

  const { data: expenses = [], isLoading: isLoadingExpenses } =
    useExpenseLogs();
  const addExpenseMutation = useAddExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const { data: vehicleProfiles = [], isLoading: isLoadingVehicleProfiles } =
    useVehicleProfiles();

  const [selectedMonth, setSelectedMonth] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<
    string | null
  >(null);
  const [expandedExpenseRows, setExpandedExpenseRows] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState('all');
  const [selectedExpenseType, setSelectedExpenseType] = useState('all');
  const [expenseSort, setExpenseSort] = useState<ExpenseSortState>({
    column: 'date',
    direction: 'desc',
  });

  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entryModalTab, setEntryModalTab] = useState<EntryTab>('income');
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(
    null,
  );
  const [entryToDelete, setEntryToDelete] = useState<DeletableEntry | null>(
    null,
  );
  const toggleExpenseRow = (id: string) => {
    setExpandedExpenseRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const entryMonthOptions = useMemo(
    () => buildEntryMonthOptions(incomes),
    [incomes],
  );
  const monthOptions = useMemo(
    () => [
      {
        key: 'all',
        label: 'All months',
        year: 0,
        month: 0,
      },
      ...entryMonthOptions,
    ],
    [entryMonthOptions],
  );
  const defaultIncomeMonthKey = useMemo(
    () => monthOptions[0]?.key ?? '',
    [monthOptions],
  );

  const expenseMonthEntries = useMemo(
    () => buildExpenseMonthOptions(expenses),
    [expenses],
  );
  const expenseMonthOptions = useMemo(
    () => [
      {
        key: 'all',
        label: 'All months',
        year: 0,
        month: 0,
      },
      ...expenseMonthEntries,
    ],
    [expenseMonthEntries],
  );

  useEffect(() => {
    if (!monthOptions.length) {
      return;
    }
    setSelectedMonth((prev) =>
      monthOptions.some((option) => option.key === prev)
        ? prev
        : monthOptions[0].key,
    );
  }, [monthOptions]);

  useEffect(() => {
    if (!expenseMonthOptions.length) {
      return;
    }
    setSelectedExpenseMonth((prev) =>
      expenseMonthOptions.some((option) => option.key === prev)
        ? prev
        : expenseMonthOptions[0].key,
    );
  }, [expenseMonthOptions]);

  const filteredByMonth = useMemo(() => {
    if (!selectedMonth) {
      return [];
    }
    if (selectedMonth === 'all') {
      return incomes;
    }
    return incomes.filter((entry) => {
      const parsed = getEntryMonth(entry);
      return parsed
        ? `${parsed.year}-${parsed.month}` === selectedMonth
        : false;
    });
  }, [incomes, selectedMonth]);

  const filteredIncomes = useMemo(() => {
    if (platformFilter.length === 0) {
      return filteredByMonth;
    }
    const selectedPlatforms = new Set(platformFilter);
    return filteredByMonth.filter((entry) =>
      selectedPlatforms.has(entry.platform),
    );
  }, [filteredByMonth, platformFilter]);

  const filteredExpensesByVehicle = useMemo(() => {
    if (!selectedVehicleFilter) {
      return expenses;
    }
    return expenses.filter(
      (entry) => entry.vehicleProfileId === selectedVehicleFilter,
    );
  }, [expenses, selectedVehicleFilter]);

  const filteredExpensesByType = useMemo(() => {
    if (!selectedExpenseType || selectedExpenseType === 'all') {
      return filteredExpensesByVehicle;
    }
    return filteredExpensesByVehicle.filter(
      (entry) => entry.expenseType === selectedExpenseType,
    );
  }, [filteredExpensesByVehicle, selectedExpenseType]);

  const filteredExpensesByMonth = useMemo(() => {
    if (!selectedExpenseMonth || selectedExpenseMonth === 'all') {
      return filteredExpensesByType;
    }
    return filteredExpensesByType.filter((entry) => {
      const parsed = getExpenseEntryMonth(entry);
      return parsed
        ? `${parsed.year}-${parsed.month}` === selectedExpenseMonth
        : false;
    });
  }, [filteredExpensesByType, selectedExpenseMonth]);

  const sortedExpenses = useMemo(() => {
    if (!expenseSort || !filteredExpensesByMonth.length) {
      return filteredExpensesByMonth;
    }
    const entries = [...filteredExpensesByMonth];
    const compareExpenseEntries = (a: ExpenseEntry, b: ExpenseEntry) => {
      switch (expenseSort.column) {
        case 'type': {
          const aLabel = formatExpenseType(a.expenseType);
          const bLabel = formatExpenseType(b.expenseType);
          return aLabel.localeCompare(bLabel, undefined, {
            sensitivity: 'base',
          });
        }
        case 'amount':
          return a.amountMinor - b.amountMinor;
        case 'date': {
          const aTimestamp = new Date(a.paidAt).getTime();
          const bTimestamp = new Date(b.paidAt).getTime();
          if (Number.isNaN(aTimestamp) || Number.isNaN(bTimestamp)) {
            return 0;
          }
          return aTimestamp - bTimestamp;
        }
        default:
          return 0;
      }
    };
    entries.sort((a, b) => {
      const comparison = compareExpenseEntries(a, b);
      return expenseSort.direction === 'asc' ? comparison : -comparison;
    });
    return entries;
  }, [expenseSort, filteredExpensesByMonth]);

  const combinedTransactions = useMemo(() => {
    const data: CombinedTransaction[] = [
      ...incomes.map((entry) => ({
        type: 'income' as const,
        entry,
        date: entry.date,
      })),
      ...filteredExpensesByVehicle.map((entry) => ({
        type: 'expense' as const,
        entry,
        date: entry.paidAt,
      })),
    ];
    return data.sort((a, b) => {
      const aTimestamp = new Date(a.date).getTime();
      const bTimestamp = new Date(b.date).getTime();
      return bTimestamp - aTimestamp;
    });
  }, [incomes, filteredExpensesByVehicle]);

  const dailySummaries = useMemo(
    () => aggregateDailyIncomes(filteredIncomes),
    [filteredIncomes],
  );

  const platformOptions = useMemo(() => {
    const platforms = Array.from(
      new Set(incomes.map((entry) => entry.platform)),
    );
    return platforms.sort();
  }, [incomes]);

  const table = useReactTable({
    data: dailySummaries,
    columns: buildColumns(currency),
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand: () => true,
  });

  const handleResetTableControls = () => {
    setSelectedMonth(defaultIncomeMonthKey);
    setPlatformFilter([]);
    setSorting([]);
  };

  const handlePlatformFilterReset = () => {
    setPlatformFilter([]);
  };

  const togglePlatformSelection = (platform: string) => {
    setPlatformFilter((prev) =>
      prev.includes(platform)
        ? prev.filter((value) => value !== platform)
        : [...prev, platform],
    );
  };

  const handleResetExpenseFilters = () => {
    setSelectedVehicleFilter(null);
    setSelectedExpenseMonth(expenseMonthOptions[0]?.key ?? 'all');
    setSelectedExpenseType('all');
  };
  const isExpenseFilterDirty =
    !!selectedVehicleFilter ||
    selectedExpenseMonth !== expenseMonthOptions[0]?.key ||
    selectedExpenseType !== 'all';
  const isIncomeFilterDirty =
    selectedMonth !== defaultIncomeMonthKey ||
    platformFilter.length > 0 ||
    sorting.length > 0;

  const toggleExpenseSort = (column: ExpenseSortColumn) => {
    setExpenseSort((prev) => {
      if (!prev || prev.column !== column) {
        return { column, direction: 'desc' };
      }
      if (prev.direction === 'desc') {
        return { column, direction: 'asc' };
      }
      return null;
    });
  };

  const getExpenseSortIcon = (column: ExpenseSortColumn) => {
    if (!expenseSort || expenseSort.column !== column) {
      return 'fa-arrows-up-down';
    }
    return expenseSort.direction === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down';
  };

  const hasAnyIncome = incomes.length > 0;
  const hasVehicleProfiles = vehicleProfiles.length > 0;
  const hasAnyExpense = expenses.length > 0;
  const expenseEmptyMessage = hasAnyExpense
    ? 'No expenses match the selected filters.'
    : 'No expenses yet.';

  const emptyMonthMessage = hasAnyIncome
    ? `No income was logged during ${
        monthOptions.find((option) => option.key === selectedMonth)?.label ??
        'this period'
      }.`
    : 'No logs yet. Add your first income entry to begin tracking.';

  const openEntryModal = (tab: EntryTab) => {
    setEntryModalTab(tab);
    setEditingIncome(null);
    setEditingExpense(null);
    setEntryModalOpen(true);
  };
  const closeEntryModal = () => {
    setEntryModalOpen(false);
    setEditingIncome(null);
    setEditingExpense(null);
  };

  const handleEditIncome = (entry: IncomeEntry) => {
    setEntryModalTab('income');
    setEditingIncome(entry);
    setEditingExpense(null);
    setEntryModalOpen(true);
  };

  const handleEditExpense = (entry: ExpenseEntry) => {
    setEntryModalTab('expense');
    setEditingExpense(entry);
    setEditingIncome(null);
    setEntryModalOpen(true);
  };

  const handleAddIncome = async (payload: {
    id?: string;
    date: string;
    platform: string;
    amount: number;
  }) => {
    await addIncomeMutation.mutateAsync(payload);
  };

  const handleUpdateIncome = async (payload: {
    id: string;
    date: string;
    platform: string;
    amount: number;
  }) => {
    await updateIncomeMutation.mutateAsync(payload);
  };

  const handleAddExpense = async (payload: ExpensePayload) => {
    await addExpenseMutation.mutateAsync(payload);
  };

  const handleUpdateExpense = async (
    payload: ExpensePayload & { id: string },
  ) => {
    await updateExpenseMutation.mutateAsync(payload);
  };

  const handleDeleteEntry = (entry: DeletableEntry) => {
    setEntryToDelete(entry);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) {
      return;
    }
    if (entryToDelete.type === 'income') {
      await deleteIncomeMutation.mutateAsync({ id: entryToDelete.entry.id });
    } else {
      await deleteExpenseMutation.mutateAsync({ id: entryToDelete.entry.id });
    }
    setEntryToDelete(null);
  };

  const handleCancelDelete = () => {
    setEntryToDelete(null);
  };

  const incomeHasEntriesForSelectedMonth = dailySummaries.length > 0;

  const isAnyLoading =
    isLoadingIncomes || isLoadingExpenses || isLoadingVehicleProfiles;

  const incomeMutationPending =
    addIncomeMutation.isPending || updateIncomeMutation.isPending;
  const expenseMutationPending =
    addExpenseMutation.isPending || updateExpenseMutation.isPending;

  const viewDescription =
    view === 'income'
      ? 'Tabulate daily totals and expand each row to see platform breakdowns.'
      : view === 'expenses'
        ? 'Review logged expenses with context around the rate, vehicle, and notes.'
        : 'Review every income and expense transaction in one chronological feed.';

  const vehicleFilterControl = hasVehicleProfiles ? (
    <div className='flex flex-row items-center gap-2'>
      <label className='select select-sm'>
        <select
          value={selectedVehicleFilter ?? ''}
          onChange={(event) =>
            setSelectedVehicleFilter(
              event.target.value ? event.target.value : null,
            )
          }
        >
          <option value=''>All vehicles</option>
          {vehicleProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type='button'
        className='btn btn-xs btn-square btn-error text-xs hidden md:inline-flex'
        onClick={() => setSelectedVehicleFilter(null)}
        disabled={!selectedVehicleFilter}
        aria-label='Clear platform filters'
      >
        <i className='fa-solid fa-xmark' aria-hidden='true' />
      </button>
    </div>
  ) : null;

  const renderExpenseSortButton = (
    column: ExpenseSortColumn,
    label: string,
    alignRight = false,
  ) => {
    const isActive = expenseSort?.column === column;
    const alignmentClasses =
      alignRight === true
        ? 'justify-end text-right'
        : 'justify-start text-left';
    return (
      <button
        type='button'
        className={`flex w-full items-center gap-2 text-xs font-semibold uppercase ${alignmentClasses}`}
        onClick={() => toggleExpenseSort(column)}
        aria-pressed={isActive}
      >
        <span className={`text-base-content ${isActive ? 'text-primary' : ''}`}>
          {label}
        </span>
        <span
          aria-hidden='true'
          className={`fa-solid ${getExpenseSortIcon(column)} text-[0.6rem] ${
            isActive ? 'text-primary' : 'text-base-content/60'
          }`}
        />
      </button>
    );
  };

  return (
    <div className='space-y-6'>
      <header className='flex flex-col gap-2'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-xs uppercase text-base-content/60'>Logs</p>
            <h1 className='text-3xl font-semibold text-base-content'>
              Transaction Logs
            </h1>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <div role='tablist' className='tabs tabs-box'>
              {LOG_TABS.map((tab) => (
                <input
                  key={tab.key}
                  type='radio'
                  name='logs-view-tabs'
                  className='tab'
                  aria-label={tab.label}
                  checked={view === tab.key}
                  onChange={() => handleSetView(tab.key)}
                />
              ))}
            </div>
            <button
              type='button'
              className='btn btn-primary btn-sm md:btn-md'
              onClick={() => openEntryModal('income')}
            >
              <span className='fa-solid fa-plus mr-2' aria-hidden='true' />
              Add
            </button>
          </div>
        </div>
        <p className='text-sm text-base-content/60'>{viewDescription}</p>
      </header>

      {view === 'all' && (
        <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm space-y-4'>
          {vehicleFilterControl && (
            <div className='flex flex-col gap-2 text-sm text-base-content/70 md:flex-row md:items-center md:justify-between'>
              <span className='text-xs uppercase'>Vehicles</span>
              <div>{vehicleFilterControl}</div>
            </div>
          )}
          {isAnyLoading ? (
            <LoadingState message='Loading logs…' />
          ) : combinedTransactions.length === 0 ? (
            <div className='flex min-h-40 flex-col items-center justify-center text-sm text-base-content/60'>
              <p>
                No transactions yet. Add your first income or expense entry.
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {combinedTransactions.map((item) => {
                const label =
                  item.type === 'income'
                    ? item.entry.platform
                    : formatExpenseType(item.entry.expenseType);
                const amountText =
                  item.type === 'income'
                    ? formatCurrency(item.entry.amount, currency)
                    : formatCurrency(item.entry.amountMinor / 100, currency);
                return (
                  <CombinedTransactionCard
                    key={`${item.type}-${item.entry.id}`}
                    label={label}
                    dateLabel={formatDateLabel(item.date)}
                    vehicleLabel={
                      item.type === 'expense'
                        ? item.entry.vehicle?.label
                        : undefined
                    }
                    amountText={amountText}
                    isIncome={item.type === 'income'}
                    expenseRate={
                      item.type === 'expense'
                        ? formatExpenseRate(item.entry)
                        : undefined
                    }
                    onEdit={() =>
                      item.type === 'income'
                        ? handleEditIncome(item.entry)
                        : handleEditExpense(item.entry)
                    }
                    onDelete={() => handleDeleteEntry(item)}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {view === 'income' && (
        <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm space-y-4'>
          <FilterPanel
            title='Filtering Options'
            onReset={handleResetTableControls}
            isResetDisabled={!isIncomeFilterDirty}
          >
            <FilterSelect
              label='Month'
              id='monthly-filter'
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              disabled={isLoadingIncomes}
              ariaBusy={isLoadingIncomes}
              rowClassName='gap-1'
              options={monthOptions.map((option) => ({
                value: option.key,
                label: option.label,
              }))}
            />
            {platformOptions.length ? (
              <FilterRow label='Platforms' className='gap-2'>
                <div className='flex flex-wrap gap-2 px-1 md:flex-nowrap md:overflow-x-auto'>
                  {platformOptions.map((platform) => {
                    const isChecked = platformFilter.includes(platform);
                    return (
                      <label
                        key={platform}
                        className={`btn btn-xs normal-case ${
                          isChecked
                            ? 'btn-primary btn-active text-white'
                            : 'btn-outline'
                        }`}
                      >
                        <input
                          type='checkbox'
                          name='platforms'
                          value={platform}
                          aria-label={platform}
                          checked={isChecked}
                          onChange={() => togglePlatformSelection(platform)}
                          className='sr-only'
                        />
                        {platform}
                      </label>
                    );
                  })}
                  <button
                    type='button'
                    className='btn btn-xs btn-square btn-error text-xs hidden md:inline-flex'
                    onClick={handlePlatformFilterReset}
                    disabled={!platformFilter.length}
                    aria-label='Clear platform filters'
                  >
                    <i className='fa-solid fa-xmark' aria-hidden='true' />
                  </button>
                </div>
              </FilterRow>
            ) : (
              <span className='text-xs uppercase text-base-content/60'>
                No platforms yet
              </span>
            )}
          </FilterPanel>
          {isLoadingIncomes ? (
            <LoadingState message='Loading logs…' />
          ) : !incomeHasEntriesForSelectedMonth ? (
            <div className='flex min-h-60 flex-col items-center justify-center gap-3 text-sm text-base-content/60'>
              <p>{emptyMonthMessage}</p>
              <p className='text-xs text-base-content/60'>
                {hasAnyIncome
                  ? `Switch months or add an income entry to fill the timeframe.`
                  : 'Hit the button above to log your first income.'}
              </p>
              <button
                type='button'
                className='btn btn-sm btn-outline'
                onClick={() => openEntryModal('income')}
              >
                Create entry
              </button>
            </div>
          ) : (
            <div className='space-y-3'>
              {table.getHeaderGroups().length ? (
                <div
                  className={`hidden ${GRID_TEMPLATE_CLASS} bg-base-100/50 py-3 gap-4 text-xs uppercase text-base-content/60 px-4`}
                >
                  {table.getHeaderGroups()[0].headers.map((header) => (
                    <div key={header.id} className='text-left'>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </div>
                  ))}
                  <span
                    aria-hidden='true'
                    className='fa-solid fa-up-down text-xs text-base-content/60'
                  />
                </div>
              ) : null}
              <div className='space-y-3'>
                {table.getRowModel().rows.map((row) => (
                  <div key={row.id} className='space-y-0.5'>
                    <div className='border border-base-content/10 bg-base-200/80 shadow-sm'>
                      <button
                        type='button'
                        className={`flex w-full flex-wrap items-center gap-4 p-4 text-left transition hover:bg-base-100 ${GRID_TEMPLATE_CLASS}`}
                        onClick={() => row.toggleExpanded()}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isPlatformColumn =
                            cell.column.id === 'breakdown';
                          const isTotalColumn = cell.column.id === 'total';
                          const classes = [
                            'truncate',
                            'text-sm',
                            'font-semibold',
                            'text-base-content/80',
                            isPlatformColumn
                              ? 'hidden md:block'
                              : 'min-w-0 flex-1 md:flex-none',
                            isTotalColumn ? 'text-right' : 'text-left',
                          ]
                            .filter(Boolean)
                            .join(' ');
                          return (
                            <div key={cell.id} className={classes}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </div>
                          );
                        })}
                        <span
                          aria-hidden='true'
                          className={`fa-solid fa-chevron-${
                            row.getIsExpanded() ? 'up' : 'down'
                          } ml-auto text-xs text-base-content/60`}
                        />
                      </button>
                      {row.getIsExpanded() && (
                        <div className='border-t border-base-content/10 bg-base-100 p-4'>
                          <div className='flex items-center justify-between text-sm font-semibold text-base-content/60'>
                            <span>Entries</span>
                            <span className='text-xs uppercase '>
                              {row.original.entries.length}{' '}
                              {row.original.entries.length === 1
                                ? 'entry'
                                : 'entries'}
                            </span>
                          </div>
                          <div className='mt-3 space-y-2 text-sm text-base-content/70'>
                            {row.original.entries.length ? (
                              row.original.entries.map((entry) => (
                                <div
                                  key={entry.id}
                                  className='flex items-center justify-between border border-base-content/10 bg-base-200/80 px-3 py-2'
                                >
                                  <div>
                                    <p className='font-medium text-base-content'>
                                      {entry.platform}
                                    </p>
                                    <p className='text-xs text-base-content/60'>
                                      {formatCurrency(entry.amount, currency)}
                                    </p>
                                  </div>
                                  <EntryActions
                                    onEdit={() => handleEditIncome(entry)}
                                    onDelete={() =>
                                      handleDeleteEntry({
                                        type: 'income',
                                        entry,
                                        date: entry.date,
                                      })
                                    }
                                    deleteDisabled={
                                      deleteIncomeMutation.isPending
                                    }
                                    editClassName='btn btn-xs btn-outline btn-ghost'
                                  />
                                </div>
                              ))
                            ) : (
                              <p className='text-xs text-base-content/50'>
                                No entries were recorded for this day.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {view === 'expenses' && (
        <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm space-y-4'>
          <FilterPanel
            title='Filtering Options'
            onReset={handleResetExpenseFilters}
            isResetDisabled={!isExpenseFilterDirty}
          >
            <FilterSelect
              label='Month'
              id='expenses-month-filter'
              value={selectedExpenseMonth}
              onChange={(event) => setSelectedExpenseMonth(event.target.value)}
              disabled={isLoadingExpenses}
              ariaBusy={isLoadingExpenses}
              options={expenseMonthOptions.map((option) => ({
                value: option.key,
                label: option.label,
              }))}
            />
            <FilterSelect
              label='Type'
              value={selectedExpenseType}
              onChange={(event) => setSelectedExpenseType(event.target.value)}
              disabled={isLoadingExpenses}
              ariaBusy={isLoadingExpenses}
              options={[
                { value: 'all', label: 'All types' },
                ...expenseTypeOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                })),
              ]}
            />
            <FilterRow label='Vehicles'>
              <div className='flex flex-wrap justify-end gap-2'>
                {vehicleFilterControl ?? (
                  <span className='text-xs uppercase text-base-content/60'>
                    Add a vehicle profile to filter expenses.
                  </span>
                )}
              </div>
            </FilterRow>
          </FilterPanel>
          {isLoadingExpenses ? (
            <LoadingState message='Loading expenses…' />
          ) : filteredExpensesByMonth.length === 0 ? (
            <div className='flex min-h-40 flex-col items-center justify-center text-sm text-base-content/60'>
              <p>{expenseEmptyMessage}</p>
            </div>
          ) : (
            <div className='space-y-3'>
              <div
                className={`hidden ${GRID_TEMPLATE_CLASS} bg-base-100/50 py-3 gap-4 text-xs uppercase text-base-content/60 px-4`}
              >
                <div className='text-left'>
                  {renderExpenseSortButton('date', 'Date')}
                </div>
                <div className='text-left'>
                  {renderExpenseSortButton('type', 'Type')}
                </div>
                <div className='text-right'>
                  {renderExpenseSortButton('amount', 'Amount', true)}
                </div>
                <span
                  aria-hidden='true'
                  className='fa-solid fa-up-down text-xs text-base-content/60'
                />
              </div>
              <div className='space-y-2'>
                {sortedExpenses.map((entry) => {
                  const isExpanded = expandedExpenseRows.has(entry.id);
                  const amountText = formatCurrency(
                    entry.amountMinor / 100,
                    currency,
                  );
                  return (
                    <div key={entry.id} className='space-y-0.5'>
                      <div className='border border-base-content/10 bg-base-200/80 shadow-sm'>
                        <button
                          type='button'
                          className={`flex w-full flex-wrap items-center gap-4 p-4 text-left transition hover:bg-base-100 ${GRID_TEMPLATE_CLASS}`}
                          onClick={() => toggleExpenseRow(entry.id)}
                          aria-expanded={isExpanded}
                        >
                          <span className='min-w-0 flex-1 text-sm font-semibold text-base-content/80'>
                            {formatDateLabel(entry.paidAt)}
                          </span>
                          <span className='min-w-0 text-sm font-semibold text-base-content/80'>
                            {formatExpenseType(entry.expenseType)}
                          </span>
                          <span className='min-w-0 text-right text-sm font-semibold text-error'>
                            -{amountText}
                          </span>
                          <span
                            aria-hidden='true'
                            className={`fa-solid fa-chevron-${
                              isExpanded ? 'up' : 'down'
                            } ml-auto text-xs text-base-content/60`}
                          />
                        </button>
                        {isExpanded && (
                          <div className='border-t border-base-content/10 bg-base-100 p-4 text-sm text-base-content/70'>
                            <div className='grid gap-3 md:grid-cols-4 items-center'>
                              <div>
                                <p className='text-xs uppercase text-base-content/60'>
                                  Vehicle
                                </p>
                                <p className='text-sm text-base-content'>
                                  {entry.vehicle?.label ?? '—'}
                                </p>
                              </div>
                              <div>
                                <p className='text-xs uppercase text-base-content/60'>
                                  Rate
                                </p>
                                <p className='text-sm text-base-content'>
                                  {formatExpenseRate(entry)}
                                </p>
                              </div>
                              <div>
                                <p className='text-xs uppercase text-base-content/60'>
                                  Notes
                                </p>
                                <p className='text-sm text-base-content/70 wrap-break-word'>
                                  {entry.notes ?? '—'}
                                </p>
                              </div>
                              <div className='flex flex-wrap gap-2 justify-end'>
                                <EntryActions
                                  onEdit={() => handleEditExpense(entry)}
                                  onDelete={() =>
                                    handleDeleteEntry({
                                      type: 'expense',
                                      entry,
                                      date: entry.paidAt,
                                    })
                                  }
                                  deleteDisabled={
                                    deleteExpenseMutation.isPending
                                  }
                                  editClassName='btn btn-xs btn-outline btn-ghost'
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      <EntryModal
        isOpen={entryModalOpen}
        activeTab={entryModalTab}
        onTabChange={setEntryModalTab}
        currency={currency}
        vehicleProfiles={vehicleProfiles}
        volumeUnit={volumeUnit}
        editingIncome={editingIncome}
        editingExpense={editingExpense}
        onSubmitIncome={(payload) => {
          if (payload.id) {
            return handleUpdateIncome(
              payload as {
                id: string;
                date: string;
                platform: string;
                amount: number;
              },
            );
          }
          return handleAddIncome(payload);
        }}
        onSubmitExpense={(payload) =>
          payload.id
            ? handleUpdateExpense(payload as ExpensePayload & { id: string })
            : handleAddExpense(payload)
        }
        isSubmittingIncome={incomeMutationPending}
        isSubmittingExpense={expenseMutationPending}
        onClose={closeEntryModal}
      />

      {entryToDelete && (
        <div className='modal modal-open'>
          <div className='modal-box'>
            <h3 className='text-lg font-semibold text-base-content'>
              Confirm deletion
            </h3>
            <p className='mt-2 text-sm text-base-content/60'>
              Remove{' '}
              {entryToDelete.type === 'income'
                ? formatCurrency(entryToDelete.entry.amount, currency)
                : formatCurrency(
                    entryToDelete.entry.amountMinor / 100,
                    currency,
                  )}{' '}
              from {formatDateLabel(entryToDelete.date)} (
              {entryToDelete.type === 'income'
                ? entryToDelete.entry.platform
                : formatExpenseType(entryToDelete.entry.expenseType)}
              )? This action cannot be undone.
            </p>
            <div className='modal-action mt-4'>
              <button
                type='button'
                className='btn btn-ghost'
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                type='button'
                className={`btn btn-error ${
                  (
                    entryToDelete.type === 'income'
                      ? deleteIncomeMutation.isPending
                      : deleteExpenseMutation.isPending
                  )
                    ? 'loading'
                    : ''
                }`}
                onClick={handleConfirmDelete}
                disabled={
                  entryToDelete.type === 'income'
                    ? deleteIncomeMutation.isPending
                    : deleteExpenseMutation.isPending
                }
              >
                Delete entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
