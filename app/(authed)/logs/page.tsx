'use client';

import type { Column, SortingState } from '@tanstack/react-table';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

import {
  aggregateDailyIncomes,
  type DailyIncomeSummary,
  formatCurrency,
  formatMonthLabel,
  getEntryMonth,
  type IncomeEntry,
  type MonthOption,
} from '@/lib/income';
import { useDeleteIncome, useIncomeLogs } from '@/lib/queries/income';

import IncomeEntryModal from './_components/IncomeEntryModal';

const columnHelper = createColumnHelper<DailyIncomeSummary>();

const renderSortableHeader = (
  column: Column<DailyIncomeSummary>,
  label: string,
) => (
  <button
    type='button'
    className='flex items-center gap-2 text-xs font-semibold uppercase '
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

const columns = [
  columnHelper.accessor('date', {
    header: ({ column }) => renderSortableHeader(column, 'Date'),
    cell: (info) => (
      <div className='text-sm font-semibold text-base-content'>
        {info.getValue()}
      </div>
    ),
  }),
  columnHelper.accessor('total', {
    header: ({ column }) => renderSortableHeader(column, 'Total income'),
    cell: (info) => (
      <div className='text-sm font-semibold text-base-content'>
        {formatCurrency(info.getValue())}
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

const GRID_TEMPLATE_CLASS =
  'grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center';
export default function LogsPage() {
  const { data: incomes = [], isLoading } = useIncomeLogs();

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
  const [selectedMonth, setSelectedMonth] = useState(
    () => monthOptions[0]?.key ?? '',
  );
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
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
  const dailySummaries = useMemo(
    () => aggregateDailyIncomes(filteredIncomes),
    [filteredIncomes],
  );
  const selectedMonthLabel =
    monthOptions.find((option) => option.key === selectedMonth)?.label ??
    'current month';
  const hasAnyIncome = incomes.length > 0;
  const platformOptions = useMemo(() => {
    const platforms = Array.from(
      new Set(incomes.map((entry) => entry.platform)),
    );
    return platforms.sort();
  }, [incomes]);
  const emptyMonthMessage = hasAnyIncome
    ? `No income was logged during ${selectedMonthLabel}. Add an entry to seed this month or pick another timeframe.`
    : 'No logs yet. Add your first income entry to begin tracking.';

  const hasEntriesForSelectedMonth = dailySummaries.length > 0;
  const deleteIncomeMutation = useDeleteIncome();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IncomeEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<IncomeEntry | null>(null);

  const openAddModal = () => {
    setEditingEntry(null);
    setModalOpen(true);
  };

  const openEditModal = (entry: IncomeEntry) => {
    setEditingEntry(entry);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingEntry(null);
  };

  const isDeleting = deleteIncomeMutation.isPending;

  const handleResetTableControls = () => {
    setSelectedMonth(monthOptions[0]?.key ?? '');
    setPlatformFilter([]);
    setSorting([]);
  };

  const handlePlatformFilterReset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPlatformFilter([]);
  };

  const togglePlatformSelection = (platform: string) => {
    setPlatformFilter((prev) =>
      prev.includes(platform)
        ? prev.filter((value) => value !== platform)
        : [...prev, platform],
    );
  };

  const table = useReactTable({
    data: dailySummaries,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand: () => true,
  });

  const handleDeleteEntry = (entry: IncomeEntry) => {
    if (isDeleting) {
      return;
    }
    setEntryToDelete(entry);
  };

  const handleCancelDelete = () => {
    setEntryToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!entryToDelete) {
      return;
    }

    deleteIncomeMutation.mutate(
      { id: entryToDelete.id },
      {
        onSuccess: () => {
          setEntryToDelete(null);
        },
      },
    );
  };

  return (
    <div className='space-y-6'>
      <header className='flex flex-col gap-2'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <p className='text-xs uppercase text-base-content/60'>Logs</p>
            <h1 className='text-3xl font-semibold text-base-content'>
              Income Logs
            </h1>
          </div>
          <button
            type='button'
            className='btn btn-primary'
            onClick={openAddModal}
          >
            <span className='fa-solid fa-plus mr-2' aria-hidden='true' />
            Add income
          </button>
        </div>
        <p className='text-sm text-base-content/60'>
          Tabulate daily totals and expand each row to see platform breakdowns.
        </p>
      </header>

      <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
        <div className='flex flex-col gap-2 bg-base-200 p-4'>
          <div className='flex flex-row items-center justify-between'>
            <h1>Filtering Options</h1>
            <button
              type='button'
              className='btn btn-sm btn-warning'
              onClick={handleResetTableControls}
            >
              Reset filters & sorting
            </button>
          </div>
          <div className='flex flex-col md:flex-row items-center gap-3'>
            <div className='flex flex-col gap-1'>
              <label className='select'>
                <span className='label'>Month</span>
                <select
                  id='monthly-filter'
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {monthOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              {platformOptions.length ? (
                <form
                  onReset={handlePlatformFilterReset}
                  className='flex flex-wrap items-center gap-2'
                >
                  <label className='input w-full'>
                    <span className='label'>Filter by platform</span>

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
                      type='reset'
                      className='btn btn-xs btn-square btn-error text-xs'
                      aria-label='Clear platform filters'
                    >
                      <span className='fa-solid fa-xmark' aria-hidden='true' />
                    </button>
                  </label>
                </form>
              ) : (
                <span className='text-xs uppercase text-base-content/60'>
                  No platforms yet
                </span>
              )}
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className='flex min-h-60 items-center justify-center'>
            <div className='loading loading-dots loading-lg'>Loading logs…</div>
          </div>
        ) : !hasEntriesForSelectedMonth ? (
          <div className='flex min-h-60 flex-col items-center justify-center gap-3 text-sm text-base-content/60'>
            <p>{emptyMonthMessage}</p>
            <p className='text-xs text-base-content/60'>
              {hasAnyIncome
                ? `Switch months or add an income entry to fill ${selectedMonthLabel}.`
                : 'Hit the button below to log your first income.'}
            </p>
            <button
              type='button'
              className='btn btn-sm btn-outline'
              onClick={openAddModal}
            >
              Create entry
            </button>
          </div>
        ) : (
          <div className='space-y-3'>
            {table.getHeaderGroups().length ? (
              <div
                className={`hidden ${GRID_TEMPLATE_CLASS} bg-base-100/50 py-3 gap-4 text-xs uppercase text-base-content/60 md:grid px-4`}
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
                      className={`grid w-full ${GRID_TEMPLATE_CLASS} gap-4 p-4 text-left transition hover:bg-base-100`}
                      onClick={() => row.toggleExpanded()}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <div
                          key={cell.id}
                          className='truncate text-sm font-semibold text-base-content/80'
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      ))}
                      <span
                        aria-hidden='true'
                        className={`fa-solid fa-chevron-${row.getIsExpanded() ? 'up' : 'down'} text-xs text-base-content/60`}
                      />
                    </button>
                    {row.getIsExpanded() && (
                      <div className='rounded-b-3xl border-t border-base-content/10 bg-base-100 p-4'>
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
                                className='flex items-center justify-between rounded-2xl border border-base-content/10 bg-base-200/80 px-3 py-2'
                              >
                                <div>
                                  <p className='font-medium text-base-content'>
                                    {entry.platform}
                                  </p>
                                  <p className='text-xs text-base-content/60'>
                                    {formatCurrency(entry.amount)}
                                  </p>
                                </div>
                                <div className='flex items-center gap-2 text-xs'>
                                  <button
                                    type='button'
                                    className='btn btn-xs btn-outline btn-ghost'
                                    onClick={() => openEditModal(entry)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type='button'
                                    className='btn btn-xs btn-outline btn-error'
                                    onClick={() => handleDeleteEntry(entry)}
                                    disabled={isDeleting}
                                  >
                                    Delete
                                  </button>
                                </div>
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

      <IncomeEntryModal
        isOpen={modalOpen}
        editingEntry={editingEntry}
        onClose={handleCloseModal}
      />
      {entryToDelete && (
        <div className='modal modal-open'>
          <div className='modal-box'>
            <h3 className='text-lg font-semibold text-base-content'>
              Confirm deletion
            </h3>
            <p className='mt-2 text-sm text-base-content/60'>
              Remove {formatCurrency(entryToDelete.amount)} from{' '}
              {entryToDelete.date} ({entryToDelete.platform})? This action
              cannot be undone.
            </p>
            <div className='modal-action mt-4'>
              <button
                type='button'
                className='btn btn-ghost'
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type='button'
                className={`btn btn-error ${isDeleting ? 'loading' : ''}`}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
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
