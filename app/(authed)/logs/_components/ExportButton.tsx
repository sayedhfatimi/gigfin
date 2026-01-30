'use client';

import { useCallback, useState } from 'react';
import type { CurrencyCode } from '@/lib/currency';
import { formatCurrency } from '@/lib/income';
import type { CombinedTransaction } from '../_lib/types';

type ExportFormat = 'csv' | 'json';

type ExportButtonProps = {
  transactions: CombinedTransaction[];
  currency: CurrencyCode;
  className?: string;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
};

const transactionToRow = (
  item: CombinedTransaction,
  currency: CurrencyCode,
): Record<string, string | number> => {
  const baseRow = {
    date: formatDate(item.date),
    type: item.type,
  };

  if (item.type === 'income') {
    return {
      ...baseRow,
      platform: item.entry.platform,
      amount: item.entry.amount,
      amountFormatted: formatCurrency(item.entry.amount, currency),
    };
  }

  if (item.type === 'expense') {
    return {
      ...baseRow,
      category: item.entry.expenseType,
      amount: item.entry.amountMinor / 100,
      amountFormatted: formatCurrency(item.entry.amountMinor / 100, currency),
      vehicle: item.entry.vehicle?.label ?? '',
      notes: item.entry.notes ?? '',
    };
  }

  if (item.type === 'odometer') {
    return {
      ...baseRow,
      vehicle: item.entry.vehicle?.label ?? '',
      startReading: item.entry.startReading,
      endReading: item.entry.endReading,
      distance: item.entry.endReading - item.entry.startReading,
    };
  }

  return baseRow;
};

const generateCSV = (
  transactions: CombinedTransaction[],
  currency: CurrencyCode,
): string => {
  if (transactions.length === 0) return '';

  const rows = transactions.map((t) => transactionToRow(t, currency));
  const headers = Object.keys(rows[0]);

  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          const strValue = String(value ?? '');
          if (strValue.includes(',') || strValue.includes('"')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        })
        .join(','),
    ),
  ];

  return csvRows.join('\n');
};

const generateJSON = (
  transactions: CombinedTransaction[],
  currency: CurrencyCode,
): string => {
  const rows = transactions.map((t) => transactionToRow(t, currency));
  return JSON.stringify(rows, null, 2);
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function ExportButton({
  transactions,
  currency,
  className = '',
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setIsExporting(true);

      try {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `gigfin-export-${timestamp}`;

        if (format === 'csv') {
          const csv = generateCSV(transactions, currency);
          downloadFile(csv, `${filename}.csv`, 'text/csv');
        } else {
          const json = generateJSON(transactions, currency);
          downloadFile(json, `${filename}.json`, 'application/json');
        }
      } finally {
        setIsExporting(false);
      }
    },
    [transactions, currency],
  );

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className={`dropdown dropdown-end ${className}`}>
      <button
        type='button'
        tabIndex={0}
        className='btn btn-sm btn-outline gap-2'
        disabled={isExporting}
      >
        {isExporting ? (
          <span className='loading loading-spinner loading-xs' />
        ) : (
          <span className='fa-solid fa-download' aria-hidden='true' />
        )}
        Export ({transactions.length})
      </button>
      <ul className='dropdown-content menu bg-base-100 rounded-box z-10 w-40 p-2 shadow-lg border border-base-content/10'>
        <li>
          <button type='button' onClick={() => handleExport('csv')}>
            <span className='fa-solid fa-file-csv' aria-hidden='true' />
            CSV
          </button>
        </li>
        <li>
          <button type='button' onClick={() => handleExport('json')}>
            <span className='fa-solid fa-file-code' aria-hidden='true' />
            JSON
          </button>
        </li>
      </ul>
    </div>
  );
}
