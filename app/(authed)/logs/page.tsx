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
  type ExpenseEntry,
  expenseTypeOptions,
  formatExpenseType,
  type UnitRateUnit,
} from '@/lib/expenses';
import {
  aggregateDailyIncomes,
  type DailyIncomeSummary,
  formatCurrency,
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
import { type DateRange, getPresetDates } from './_components/DateRangeFilter';
import EntryModal from './_components/EntryModal';
import ExpenseTable from './_components/ExpenseTable';
import FilterToolbar from './_components/FilterToolbar';
import IncomeTable from './_components/IncomeTable';
import OdometerTable from './_components/OdometerTable';
import VehicleFilterControl from './_components/VehicleFilterControl';

import { formatDateLabel, renderSortableHeader } from './_lib/formatters';
import type {
  CombinedTransaction,
  DeletableEntry,
  ExpenseSortColumn,
  ExpenseSortState,
} from './_lib/types';
import {
  KeyboardShortcutsHint,
  useKeyboardShortcuts,
} from './_lib/useKeyboardShortcuts';

const columnHelper = createColumnHelper<DailyIncomeSummary>();
const PAGE_SIZE = 10;

const buildColumns = (currency: CurrencyCode) => [
  columnHelper.accessor('date', {
    header: ({ column }) => renderSortableHeader(column, 'Date'),
    cell: (info) => (
      <div className='text-sm font-semibold text-base-content'>
        {formatDateLabel(info.getValue())}
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

  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    ...getPresetDates('thisMonth'),
    preset: 'thisMonth',
  }));
  const platformFilterKey = platformFilter.join(',');
  const sortingSignature = useMemo(
    () =>
      sorting.map((state) => `${state.id}-${state.desc ?? false}`).join(','),
    [sorting],
  );
  const incomeResetSignature = `${platformFilterKey}-${sortingSignature}`;
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
  const [odometerPagination, setOdometerPagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<
    string | null
  >(null);
  const [expandedExpenseRows, setExpandedExpenseRows] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedExpenseType, setSelectedExpenseType] = useState('all');
  const [expenseSort, setExpenseSort] = useState<ExpenseSortState>({
    column: 'date',
    direction: 'desc',
  });
  const expenseSortSignature = expenseSort
    ? `${expenseSort.column}-${expenseSort.direction}`
    : 'none';
  const expenseResetSignature = `${selectedExpenseType}-${
    selectedVehicleFilter ?? ''
  }-${expenseSortSignature}`;

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

  const filteredIncomes = useMemo(() => {
    let filtered = incomes;
    if (platformFilter.length > 0) {
      const selectedPlatforms = new Set(platformFilter);
      filtered = filtered.filter((entry) =>
        selectedPlatforms.has(entry.platform),
      );
    }
    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((entry) => {
        const entryDate = new Date(entry.date);
        if (Number.isNaN(entryDate.getTime())) return true;
        if (dateRange.start && entryDate < dateRange.start) return false;
        if (dateRange.end && entryDate > dateRange.end) return false;
        return true;
      });
    }
    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (entry) =>
          entry.platform.toLowerCase().includes(searchLower) ||
          entry.amount.toString().includes(searchLower),
      );
    }
    return filtered;
  }, [incomes, platformFilter, dateRange, searchQuery]);

  const filteredExpensesByVehicle = useMemo(() => {
    if (!selectedVehicleFilter) {
      return expenses;
    }
    return expenses.filter(
      (entry) => entry.vehicleProfileId === selectedVehicleFilter,
    );
  }, [expenses, selectedVehicleFilter]);

  const filteredOdometersByVehicle = useMemo(() => {
    let filtered = odometers;
    if (selectedVehicleFilter) {
      filtered = filtered.filter(
        (entry) => entry.vehicleProfileId === selectedVehicleFilter,
      );
    }
    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((entry) => {
        const entryDate = new Date(entry.date);
        if (Number.isNaN(entryDate.getTime())) return true;
        if (dateRange.start && entryDate < dateRange.start) return false;
        if (dateRange.end && entryDate > dateRange.end) return false;
        return true;
      });
    }
    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (entry) =>
          (entry.vehicle?.label?.toLowerCase().includes(searchLower) ??
            false) ||
          entry.startReading.toString().includes(searchLower) ||
          entry.endReading.toString().includes(searchLower),
      );
    }
    return filtered;
  }, [odometers, selectedVehicleFilter, dateRange, searchQuery]);

  const filteredExpensesByType = useMemo(() => {
    if (!selectedExpenseType || selectedExpenseType === 'all') {
      return filteredExpensesByVehicle;
    }
    return filteredExpensesByVehicle.filter(
      (entry) => entry.expenseType === selectedExpenseType,
    );
  }, [filteredExpensesByVehicle, selectedExpenseType]);

  const filteredExpenses = useMemo(() => {
    let filtered = filteredExpensesByType;
    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((entry) => {
        const entryDate = new Date(entry.paidAt);
        if (Number.isNaN(entryDate.getTime())) return true;
        if (dateRange.start && entryDate < dateRange.start) return false;
        if (dateRange.end && entryDate > dateRange.end) return false;
        return true;
      });
    }
    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (entry) =>
          formatExpenseType(entry.expenseType)
            .toLowerCase()
            .includes(searchLower) ||
          (entry.amountMinor / 100).toString().includes(searchLower) ||
          (entry.notes?.toLowerCase().includes(searchLower) ?? false) ||
          (entry.vehicle?.label?.toLowerCase().includes(searchLower) ?? false),
      );
    }
    return filtered;
  }, [filteredExpensesByType, dateRange, searchQuery]);

  const sortedExpenses = useMemo(() => {
    if (!expenseSort || !filteredExpenses.length) {
      return filteredExpenses;
    }
    const entries = [...filteredExpenses];
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
  }, [expenseSort, filteredExpenses]);

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

  // Odometer pagination
  const odometerTotalPages = Math.ceil(
    filteredOdometersByVehicle.length / PAGE_SIZE,
  );
  const odometerCurrentPage = odometerPagination.pageIndex + 1;
  const handleOdometerPageChange = (page: number) =>
    setOdometerPagination((prev) => ({ ...prev, pageIndex: page - 1 }));
  const paginatedOdometers = filteredOdometersByVehicle.slice(
    odometerPagination.pageIndex * PAGE_SIZE,
    (odometerPagination.pageIndex + 1) * PAGE_SIZE,
  );

  // Reset odometer pagination when filter changes
  useEffect(() => {
    const maxPageIndex = Math.max(0, odometerTotalPages - 1);
    if (odometerPagination.pageIndex > maxPageIndex) {
      setOdometerPagination((prev) => ({
        ...prev,
        pageIndex: maxPageIndex,
      }));
    }
  }, [odometerPagination.pageIndex, odometerTotalPages]);

  const combinedTransactions = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();

    // Helper to check if entry matches search
    const matchesSearch = (item: CombinedTransaction): boolean => {
      if (!searchLower) return true;
      if (item.type === 'income') {
        return (
          item.entry.platform.toLowerCase().includes(searchLower) ||
          item.entry.amount.toString().includes(searchLower)
        );
      }
      if (item.type === 'expense') {
        return (
          formatExpenseType(item.entry.expenseType)
            .toLowerCase()
            .includes(searchLower) ||
          (item.entry.amountMinor / 100).toString().includes(searchLower) ||
          (item.entry.notes?.toLowerCase().includes(searchLower) ?? false) ||
          (item.entry.vehicle?.label?.toLowerCase().includes(searchLower) ??
            false)
        );
      }
      if (item.type === 'odometer') {
        return (
          (item.entry.vehicle?.label?.toLowerCase().includes(searchLower) ??
            false) ||
          item.entry.startReading.toString().includes(searchLower) ||
          item.entry.endReading.toString().includes(searchLower)
        );
      }
      return false;
    };

    // Helper to check if entry is in date range
    const isInDateRange = (dateStr: string): boolean => {
      if (!dateRange.start && !dateRange.end) return true;
      const entryDate = new Date(dateStr);
      if (Number.isNaN(entryDate.getTime())) return true;
      if (dateRange.start && entryDate < dateRange.start) return false;
      if (dateRange.end && entryDate > dateRange.end) return false;
      return true;
    };

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

    return data
      .filter((item) => isInDateRange(item.date))
      .filter(matchesSearch)
      .sort((a, b) => {
        const aTimestamp = new Date(a.date).getTime();
        const bTimestamp = new Date(b.date).getTime();
        return bTimestamp - aTimestamp;
      });
  }, [
    incomes,
    filteredExpensesByVehicle,
    filteredOdometersByVehicle,
    searchQuery,
    dateRange,
  ]);

  const combinedResetSignature = `${selectedVehicleFilter ?? ''}-${
    combinedTransactions.length
  }`;

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

  const expenseTypeLabels = useMemo(
    () =>
      expenseTypeOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [],
  );

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
    setPlatformFilter([]);
    setSorting([]);
    setSearchQuery('');
    setDateRange({
      ...getPresetDates('thisMonth'),
      preset: 'thisMonth',
    });
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
    setSelectedExpenseType('all');
    setSearchQuery('');
    setDateRange({
      ...getPresetDates('thisMonth'),
      preset: 'thisMonth',
    });
  };

  const handleResetAllFilters = () => {
    setSelectedVehicleFilter(null);
    setSearchQuery('');
    setDateRange({
      ...getPresetDates('thisMonth'),
      preset: 'thisMonth',
    });
  };

  const handleResetOdometerFilters = () => {
    setSelectedVehicleFilter(null);
    setSearchQuery('');
    setDateRange({
      ...getPresetDates('thisMonth'),
      preset: 'thisMonth',
    });
  };

  const isExpenseFilterDirty =
    !!selectedVehicleFilter ||
    selectedExpenseType !== 'all' ||
    searchQuery !== '' ||
    dateRange.preset !== 'thisMonth';
  const isIncomeFilterDirty =
    platformFilter.length > 0 ||
    sorting.length > 0 ||
    searchQuery !== '' ||
    dateRange.preset !== 'thisMonth';
  const isAllFilterDirty =
    !!selectedVehicleFilter ||
    searchQuery !== '' ||
    dateRange.preset !== 'thisMonth';
  const isOdometerFilterDirty =
    !!selectedVehicleFilter ||
    searchQuery !== '' ||
    dateRange.preset !== 'thisMonth';

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

  const emptyIncomeMessage = hasAnyIncome
    ? 'No income was logged during this period.'
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

  // Keyboard shortcuts for navigation and common actions
  useKeyboardShortcuts({
    onNew: handleAddEntry,
    onEscape: closeEntryModal,
    onNextPage: () => {
      if (view === 'all' && combinedCurrentPage < combinedTotalPages) {
        handleCombinedPageChange(combinedCurrentPage + 1);
      } else if (view === 'income' && incomeCurrentPage < incomeTotalPages) {
        handleIncomePageChange(incomeCurrentPage + 1);
      } else if (
        view === 'expenses' &&
        expenseCurrentPage < expenseTotalPages
      ) {
        handleExpensePageChange(expenseCurrentPage + 1);
      }
    },
    onPrevPage: () => {
      if (view === 'all' && combinedCurrentPage > 1) {
        handleCombinedPageChange(combinedCurrentPage - 1);
      } else if (view === 'income' && incomeCurrentPage > 1) {
        handleIncomePageChange(incomeCurrentPage - 1);
      } else if (view === 'expenses' && expenseCurrentPage > 1) {
        handleExpensePageChange(expenseCurrentPage - 1);
      }
    },
  });

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
    <div className='space-y-4 sm:space-y-6'>
      <header className='flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex items-center gap-3 sm:gap-4'>
          <div className='flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-secondary/20'>
            <i className='fa-solid fa-list-check text-lg sm:text-xl text-secondary' />
          </div>
          <div>
            <p className='text-xs uppercase text-base-content/60'>Logs</p>
            <h1 className='text-xl sm:text-2xl font-semibold text-base-content'>
              Transaction Logs
            </h1>
            <p className='hidden sm:block text-sm text-base-content/60'>
              {viewDescription}
            </p>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <div
            role='tablist'
            className='tabs tabs-box tabs-xs sm:tabs-sm md:tabs-md'
          >
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
            className={`btn btn-circle btn-sm md:btn-md ${
              view === 'income'
                ? 'btn-success'
                : view === 'expenses'
                  ? 'btn-error'
                  : view === 'odometer'
                    ? 'btn-info'
                    : 'btn-primary'
            }`}
            onClick={handleAddEntry}
            aria-label='Add entry'
          >
            <i className='fa-solid fa-plus' aria-hidden='true' />
          </button>
        </div>
      </header>

      {/* Unified Filter Toolbar */}
      <FilterToolbar
        view={view}
        currency={currency}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        platformOptions={platformOptions}
        platformFilter={platformFilter}
        onPlatformToggle={togglePlatformSelection}
        onPlatformReset={handlePlatformFilterReset}
        selectedExpenseType={selectedExpenseType}
        onExpenseTypeChange={setSelectedExpenseType}
        expenseTypeOptions={expenseTypeLabels}
        vehicleFilterControl={vehicleFilterControl}
        transactions={combinedTransactions}
        isFilterDirty={
          view === 'income'
            ? isIncomeFilterDirty
            : view === 'expenses'
              ? isExpenseFilterDirty
              : view === 'odometer'
                ? isOdometerFilterDirty
                : isAllFilterDirty
        }
        onResetFilters={
          view === 'income'
            ? handleResetTableControls
            : view === 'expenses'
              ? handleResetExpenseFilters
              : view === 'odometer'
                ? handleResetOdometerFilters
                : handleResetAllFilters
        }
        isLoading={isAnyLoading}
      />

      {view === 'all' && (
        <CombinedTable
          currency={currency}
          isLoading={isAnyLoading}
          transactions={combinedPageTransactions}
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
          hasEntriesForSelectedMonth={incomeHasEntriesForSelectedMonth}
          emptyMonthMessage={emptyIncomeMessage}
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
          expenseEmptyMessage={expenseEmptyMessage}
          expandedExpenseRows={expandedExpenseRows}
          onToggleExpenseRow={toggleExpenseRow}
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpenseEntry}
          deleteDisabled={deleteExpenseMutation.isPending}
          onCreateEntry={() => openEntryModal('expense')}
          currentPage={expenseCurrentPage}
          totalPages={expenseTotalPages}
          onPageChange={handleExpensePageChange}
        />
      )}

      {view === 'odometer' && (
        <OdometerTable
          entries={paginatedOdometers}
          isLoading={isLoadingOdometers}
          onCreateEntry={() => openEntryModal('odometer')}
          onEditEntry={handleEditOdometer}
          onDeleteEntry={handleDeleteOdometerEntry}
          deleteDisabled={deleteOdometerMutation.isPending}
          odometerUnit={odometerUnit}
          currentPage={odometerCurrentPage}
          totalPages={odometerTotalPages}
          onPageChange={handleOdometerPageChange}
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

      {/* Keyboard shortcuts hint - desktop only */}
      <KeyboardShortcutsHint />
    </div>
  );
}
