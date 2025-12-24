'use client';

import type { SortingState } from '@tanstack/react-table';
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
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
  formatExpenseType,
  getExpenseEntryMonth,
  type UnitRateUnit,
} from '@/lib/expenses';
import {
  aggregateDailyIncomes,
  type DailyIncomeSummary,
  formatCurrency,
  getEntryMonth,
  type IncomeEntry,
} from '@/lib/income';
import {
  formatOdometerDistance,
  formatOdometerReading,
  getOdometerDistance,
  type OdometerEntry,
  type OdometerUnit,
} from '@/lib/odometer';
import { useChargingVendors } from '@/lib/queries/chargingVendors';
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
import type { OdometerPayload } from '@/lib/queries/odometers';
import {
  useAddOdometer,
  useDeleteOdometer,
  useOdometerLogs,
  useUpdateOdometer,
} from '@/lib/queries/odometers';
import { useVehicleProfiles } from '@/lib/queries/vehicleProfiles';
import { getSessionUser } from '@/lib/session';
import CombinedTable from './_components/CombinedTable';
import EntryModal from './_components/EntryModal';
import ExpenseTable from './_components/ExpenseTable';
import IncomeTable from './_components/IncomeTable';
import OdometerTable from './_components/OdometerTable';
import VehicleFilterControl from './_components/VehicleFilterControl';

import {
  buildEntryMonthOptions,
  formatDateLabel,
  renderSortableHeader,
} from './_lib/formatters';
import type {
  CombinedTransaction,
  DeletableEntry,
  ExpenseSortColumn,
  ExpenseSortState,
} from './_lib/types';

const columnHelper = createColumnHelper<DailyIncomeSummary>();
const PAGE_SIZE = 10;

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
  { label: 'Odometer', key: 'odometer' },
];

type EntryTab = 'income' | 'expense' | 'odometer';

type View = 'all' | 'income' | 'expenses' | 'odometer';

const combinedColumnHelper = createColumnHelper<CombinedTransaction>();
const combinedColumns = [
  combinedColumnHelper.accessor('date', {
    header: 'Date',
    cell: (info) => info.getValue(),
  }),
];

const expenseColumnHelper = createColumnHelper<ExpenseEntry>();
const expenseColumns = [
  expenseColumnHelper.accessor('paidAt', {
    header: 'Date',
    cell: (info) => info.getValue(),
  }),
];

export default function LogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawView = searchParams.get('view');
  const view: View =
    rawView === 'income' || rawView === 'expenses' || rawView === 'odometer'
      ? rawView
      : 'all';
  const handleSetView = (nextView: View) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', nextView);
    router.push(`/logs?${params.toString()}`);
  };

  const { data: sessionData } = useSession();
  const sessionUser = getSessionUser(sessionData);
  const currency = resolveCurrency(sessionUser?.currency);
  const volumeUnit = (sessionUser?.volumeUnit ?? 'litre') as UnitRateUnit;
  const odometerUnit = (
    sessionUser?.odometerUnit === 'miles' ? 'miles' : 'km'
  ) as OdometerUnit;

  const { data: incomes = [], isLoading: isLoadingIncomes } = useIncomeLogs();
  const addIncomeMutation = useAddIncome();
  const updateIncomeMutation = useUpdateIncome();
  const deleteIncomeMutation = useDeleteIncome();

  const { data: expenses = [], isLoading: isLoadingExpenses } =
    useExpenseLogs();
  const addExpenseMutation = useAddExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const { data: odometers = [], isLoading: isLoadingOdometers } =
    useOdometerLogs();
  const addOdometerMutation = useAddOdometer();
  const updateOdometerMutation = useUpdateOdometer();
  const deleteOdometerMutation = useDeleteOdometer();

  const { data: vehicleProfiles = [], isLoading: isLoadingVehicleProfiles } =
    useVehicleProfiles();
  const { data: chargingVendors = [] } = useChargingVendors();

  const [selectedMonth, setSelectedMonth] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const platformFilterKey = platformFilter.join(',');
  const sortingSignature = useMemo(
    () =>
      sorting.map((state) => `${state.id}-${state.desc ?? false}`).join(','),
    [sorting],
  );
  const incomeResetSignature = `${selectedMonth}-${platformFilterKey}-${sortingSignature}`;
  const [combinedPagination, setCombinedPagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [incomePagination, setIncomePagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [expensePagination, setExpensePagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
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
  const expenseSortSignature = expenseSort
    ? `${expenseSort.column}-${expenseSort.direction}`
    : 'none';
  const expenseResetSignature = `${selectedExpenseMonth}-${selectedExpenseType}-${selectedVehicleFilter ?? ''}-${expenseSortSignature}`;

  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entryModalTab, setEntryModalTab] = useState<EntryTab>('income');
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(
    null,
  );
  const [editingOdometer, setEditingOdometer] = useState<OdometerEntry | null>(
    null,
  );
  const [entryToDelete, setEntryToDelete] = useState<DeletableEntry | null>(
    null,
  );
  const [expandedIncomeRows, setExpandedIncomeRows] = useState<Set<string>>(
    () => new Set(),
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
  const toggleIncomeRow = (id: string) => {
    setExpandedIncomeRows((prev) => {
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

  useEffect(() => {
    void incomeResetSignature;
    setIncomePagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  }, [incomeResetSignature]);

  useEffect(() => {
    void expenseResetSignature;
    setExpensePagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  }, [expenseResetSignature]);

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

  const filteredOdometersByVehicle = useMemo(() => {
    if (!selectedVehicleFilter) {
      return odometers;
    }
    return odometers.filter(
      (entry) => entry.vehicleProfileId === selectedVehicleFilter,
    );
  }, [odometers, selectedVehicleFilter]);

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

  const expenseTable = useReactTable({
    data: sortedExpenses,
    columns: expenseColumns,
    state: { pagination: expensePagination },
    onPaginationChange: setExpensePagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const expensePaginationModel = expenseTable.getPaginationRowModel();
  const expensePageEntries = expensePaginationModel.rows.map(
    (row) => row.original,
  );
  const expenseTotalPages = expenseTable.getPageCount();
  const expenseCurrentPage = expensePagination.pageIndex + 1;
  const handleExpensePageChange = (page: number) =>
    expenseTable.setPageIndex(page - 1);

  useEffect(() => {
    const maxPageIndex = Math.max(0, expenseTotalPages - 1);
    if (expensePagination.pageIndex > maxPageIndex) {
      setExpensePagination((prev) => ({
        ...prev,
        pageIndex: maxPageIndex,
      }));
    }
  }, [expensePagination.pageIndex, expenseTotalPages]);

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
      ...filteredOdometersByVehicle.map((entry) => ({
        type: 'odometer' as const,
        entry,
        date: entry.date,
      })),
    ];
    return data.sort((a, b) => {
      const aTimestamp = new Date(a.date).getTime();
      const bTimestamp = new Date(b.date).getTime();
      return bTimestamp - aTimestamp;
    });
  }, [incomes, filteredExpensesByVehicle, filteredOdometersByVehicle]);

  const combinedResetSignature = `${selectedVehicleFilter ?? ''}-${combinedTransactions.length}`;

  useEffect(() => {
    void combinedResetSignature;
    setCombinedPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  }, [combinedResetSignature]);

  const dailySummaries = useMemo(
    () => aggregateDailyIncomes(filteredIncomes),
    [filteredIncomes],
  );

  const combinedTable = useReactTable({
    data: combinedTransactions,
    columns: combinedColumns,
    state: { pagination: combinedPagination },
    onPaginationChange: setCombinedPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const combinedPaginationModel = combinedTable.getPaginationRowModel();
  const combinedPageRows = combinedPaginationModel.rows;
  const combinedPageTransactions = combinedPageRows.map((row) => row.original);
  const combinedTotalPages = combinedTable.getPageCount();
  const combinedCurrentPage = combinedPagination.pageIndex + 1;
  const handleCombinedPageChange = (page: number) =>
    combinedTable.setPageIndex(page - 1);

  useEffect(() => {
    const maxPageIndex = Math.max(0, combinedTotalPages - 1);
    if (combinedPagination.pageIndex > maxPageIndex) {
      setCombinedPagination((prev) => ({
        ...prev,
        pageIndex: maxPageIndex,
      }));
    }
  }, [combinedPagination.pageIndex, combinedTotalPages]);

  const platformOptions = useMemo(() => {
    const platforms = Array.from(
      new Set(incomes.map((entry) => entry.platform)),
    );
    return platforms.sort();
  }, [incomes]);

  const incomeTable = useReactTable({
    data: dailySummaries,
    columns: buildColumns(currency),
    state: { sorting, pagination: incomePagination },
    onSortingChange: setSorting,
    onPaginationChange: setIncomePagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const incomePaginationModel = incomeTable.getPaginationRowModel();
  const incomePageRows = incomePaginationModel.rows;
  const incomeTotalPages = incomeTable.getPageCount();
  const incomeCurrentPage = incomePagination.pageIndex + 1;
  const handleIncomePageChange = (page: number) =>
    incomeTable.setPageIndex(page - 1);

  useEffect(() => {
    const maxPageIndex = Math.max(0, incomeTotalPages - 1);
    if (incomePagination.pageIndex > maxPageIndex) {
      setIncomePagination((prev) => ({
        ...prev,
        pageIndex: maxPageIndex,
      }));
    }
  }, [incomePagination.pageIndex, incomeTotalPages]);

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
    setEditingOdometer(null);
    setEntryModalOpen(true);
  };
  const closeEntryModal = () => {
    setEntryModalOpen(false);
    setEditingIncome(null);
    setEditingExpense(null);
    setEditingOdometer(null);
  };
  const handleAddEntry = () => {
    if (view === 'expenses') {
      openEntryModal('expense');
      return;
    }
    if (view === 'odometer') {
      openEntryModal('odometer');
      return;
    }
    openEntryModal('income');
  };

  const handleEditIncome = (entry: IncomeEntry) => {
    setEntryModalTab('income');
    setEditingIncome(entry);
    setEditingExpense(null);
    setEditingOdometer(null);
    setEntryModalOpen(true);
  };

  const handleEditExpense = (entry: ExpenseEntry) => {
    setEntryModalTab('expense');
    setEditingExpense(entry);
    setEditingIncome(null);
    setEditingOdometer(null);
    setEntryModalOpen(true);
  };

  const handleEditOdometer = (entry: OdometerEntry) => {
    setEntryModalTab('odometer');
    setEditingOdometer(entry);
    setEditingIncome(null);
    setEditingExpense(null);
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

  const handleAddOdometer = async (payload: OdometerPayload) => {
    await addOdometerMutation.mutateAsync(payload);
  };

  const handleUpdateOdometer = async (
    payload: OdometerPayload & { id: string },
  ) => {
    await updateOdometerMutation.mutateAsync(payload);
  };

  const handleDeleteEntry = (entry: DeletableEntry) => {
    setEntryToDelete(entry);
  };

  const handleDeleteIncomeEntry = (entry: IncomeEntry) => {
    handleDeleteEntry({
      type: 'income',
      entry,
      date: entry.date,
    });
  };
  const handleDeleteExpenseEntry = (entry: ExpenseEntry) => {
    handleDeleteEntry({
      type: 'expense',
      entry,
      date: entry.paidAt,
    });
  };
  const handleDeleteOdometerEntry = (entry: OdometerEntry) => {
    handleDeleteEntry({
      type: 'odometer',
      entry,
      date: entry.date,
    });
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) {
      return;
    }
    if (entryToDelete.type === 'income') {
      await deleteIncomeMutation.mutateAsync({ id: entryToDelete.entry.id });
    } else if (entryToDelete.type === 'expense') {
      await deleteExpenseMutation.mutateAsync({ id: entryToDelete.entry.id });
    } else {
      await deleteOdometerMutation.mutateAsync({
        id: entryToDelete.entry.id,
      });
    }
    setEntryToDelete(null);
  };

  const handleCancelDelete = () => {
    setEntryToDelete(null);
  };

  const deletePending =
    entryToDelete?.type === 'income'
      ? deleteIncomeMutation.isPending
      : entryToDelete?.type === 'expense'
        ? deleteExpenseMutation.isPending
        : deleteOdometerMutation.isPending;

  const incomeHasEntriesForSelectedMonth = dailySummaries.length > 0;

  const isAnyLoading =
    isLoadingIncomes ||
    isLoadingExpenses ||
    isLoadingVehicleProfiles ||
    isLoadingOdometers;

  const incomeMutationPending =
    addIncomeMutation.isPending || updateIncomeMutation.isPending;
  const expenseMutationPending =
    addExpenseMutation.isPending || updateExpenseMutation.isPending;
  const odometerMutationPending =
    addOdometerMutation.isPending || updateOdometerMutation.isPending;

  const viewDescription =
    view === 'income'
      ? 'Tabulate daily totals and expand each row to see platform breakdowns.'
      : view === 'expenses'
        ? 'Review logged expenses with context around the rate, vehicle, and notes.'
        : view === 'odometer'
          ? 'Capture shift start and end odometer readings for each day.'
          : 'Review every income and expense transaction in one chronological feed.';

  const handleVehicleFilterClear = () => {
    setSelectedVehicleFilter(null);
  };

  const vehicleFilterControl = hasVehicleProfiles ? (
    <VehicleFilterControl
      vehicleProfiles={vehicleProfiles}
      selectedVehicleFilter={selectedVehicleFilter}
      onChange={setSelectedVehicleFilter}
      onClear={handleVehicleFilterClear}
    />
  ) : null;

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
              onClick={handleAddEntry}
            >
              <span className='fa-solid fa-plus mr-2' aria-hidden='true' />
              Add
            </button>
          </div>
        </div>
        <p className='text-sm text-base-content/60'>{viewDescription}</p>
      </header>

      {view === 'all' && (
        <CombinedTable
          currency={currency}
          isLoading={isAnyLoading}
          transactions={combinedPageTransactions}
          vehicleFilterControl={vehicleFilterControl}
          currentPage={combinedCurrentPage}
          totalPages={combinedTotalPages}
          onPageChange={handleCombinedPageChange}
          onEditIncome={handleEditIncome}
          onEditExpense={handleEditExpense}
          onEditOdometer={handleEditOdometer}
          onDeleteEntry={handleDeleteEntry}
          odometerUnit={odometerUnit}
        />
      )}

      {view === 'income' && (
        <IncomeTable
          isLoading={isLoadingIncomes}
          incomeTable={incomeTable}
          pageRows={incomePageRows}
          currency={currency}
          platformOptions={platformOptions}
          platformFilter={platformFilter}
          monthOptions={monthOptions}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          togglePlatformSelection={togglePlatformSelection}
          onPlatformFilterReset={handlePlatformFilterReset}
          onResetFilters={handleResetTableControls}
          isFilterDirty={isIncomeFilterDirty}
          hasEntriesForSelectedMonth={incomeHasEntriesForSelectedMonth}
          emptyMonthMessage={emptyMonthMessage}
          hasAnyIncome={hasAnyIncome}
          onEditEntry={handleEditIncome}
          onDeleteEntry={handleDeleteIncomeEntry}
          deleteDisabled={deleteIncomeMutation.isPending}
          onCreateEntry={() => openEntryModal('income')}
          currentPage={incomeCurrentPage}
          totalPages={incomeTotalPages}
          onPageChange={handleIncomePageChange}
          expandedRows={expandedIncomeRows}
          onToggleRow={toggleIncomeRow}
        />
      )}

      {view === 'expenses' && (
        <ExpenseTable
          isLoading={isLoadingExpenses}
          expensePageEntries={expensePageEntries}
          currency={currency}
          expenseSort={expenseSort}
          toggleExpenseSort={toggleExpenseSort}
          getExpenseSortIcon={getExpenseSortIcon}
          selectedExpenseMonth={selectedExpenseMonth}
          expenseMonthOptions={expenseMonthOptions}
          selectedExpenseType={selectedExpenseType}
          onMonthChange={setSelectedExpenseMonth}
          onTypeChange={setSelectedExpenseType}
          isExpenseFilterDirty={isExpenseFilterDirty}
          onResetFilters={handleResetExpenseFilters}
          vehicleFilterControl={vehicleFilterControl}
          expenseEmptyMessage={expenseEmptyMessage}
          expandedExpenseRows={expandedExpenseRows}
          onToggleExpenseRow={toggleExpenseRow}
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpenseEntry}
          deleteDisabled={deleteExpenseMutation.isPending}
          currentPage={expenseCurrentPage}
          totalPages={expenseTotalPages}
          onPageChange={handleExpensePageChange}
        />
      )}

      {view === 'odometer' && (
        <OdometerTable
          entries={filteredOdometersByVehicle}
          isLoading={isLoadingOdometers}
          onCreateEntry={() => openEntryModal('odometer')}
          onEditEntry={handleEditOdometer}
          onDeleteEntry={handleDeleteOdometerEntry}
          deleteDisabled={deleteOdometerMutation.isPending}
          vehicleFilterControl={vehicleFilterControl}
          odometerUnit={odometerUnit}
        />
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
        editingOdometer={editingOdometer}
        chargingVendors={chargingVendors}
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
        onSubmitOdometer={(payload) =>
          payload.id
            ? handleUpdateOdometer(payload as OdometerPayload & { id: string })
            : handleAddOdometer(payload)
        }
        isSubmittingIncome={incomeMutationPending}
        isSubmittingExpense={expenseMutationPending}
        isSubmittingOdometer={odometerMutationPending}
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
              {entryToDelete.type === 'income' ? (
                formatCurrency(entryToDelete.entry.amount, currency)
              ) : entryToDelete.type === 'expense' ? (
                formatCurrency(entryToDelete.entry.amountMinor / 100, currency)
              ) : (
                <>
                  {formatOdometerReading(
                    entryToDelete.entry.startReading,
                    odometerUnit,
                  )}{' '}
                  →{' '}
                  {formatOdometerReading(
                    entryToDelete.entry.endReading,
                    odometerUnit,
                  )}{' '}
                  (
                  {formatOdometerDistance(
                    getOdometerDistance(entryToDelete.entry),
                    odometerUnit,
                  )}
                  )
                </>
              )}{' '}
              from {formatDateLabel(entryToDelete.date)} (
              {entryToDelete.type === 'income'
                ? entryToDelete.entry.platform
                : entryToDelete.type === 'expense'
                  ? formatExpenseType(entryToDelete.entry.expenseType)
                  : 'Odometer reading'}
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
                className={`btn btn-error ${deletePending ? 'loading' : ''}`}
                onClick={handleConfirmDelete}
                disabled={deletePending}
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
