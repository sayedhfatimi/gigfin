import { desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { expense } from '@/db/expense-schema';
import { income } from '@/db/income-schema';
import { vehicleProfile } from '@/db/vehicle-profile-schema';
import { requireUserId } from '@/lib/server/session';

import { escapeCsvValue, formatDateValue, formatMinorAmount } from '../utils';

const formatIncomeAmount = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : '';

const toTimestamp = (
  value: string | number | Date | null | undefined,
): number => {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const buildCombinedCsv = (
  entries: {
    type: 'income' | 'expense';
    date: string | Date | number;
    category: string;
    amount: string;
    vehicleLabel: string | null;
    notes: string | null;
    unitRateMinor: number | null;
    unitRateUnit: string | null;
    detailsJson: string | null;
    createdAt: string | Date | number;
    id: string;
  }[],
): string => {
  const header = [
    'Type',
    'Date',
    'Platform / Expense type',
    'Amount',
    'Vehicle label',
    'Notes',
    'Unit rate minor',
    'Unit rate unit',
    'Details JSON',
    'Created At',
    'Entry ID',
  ];
  const rows = entries.map((entry) => [
    entry.type === 'income' ? 'Income' : 'Expense',
    formatDateValue(entry.date),
    entry.category,
    entry.amount,
    entry.vehicleLabel ?? '',
    entry.notes ?? '',
    entry.unitRateMinor ?? '',
    entry.unitRateUnit ?? '',
    entry.detailsJson ?? '',
    formatDateValue(entry.createdAt),
    entry.id,
  ]);
  const csvLines = [header, ...rows].map((row) =>
    row.map((cell) => escapeCsvValue(cell)).join(','),
  );
  return csvLines.join('\n');
};

export async function GET(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const incomeRows = await db
    .select({
      id: income.id,
      platform: income.platform,
      amount: income.amount,
      date: income.date,
      createdAt: income.createdAt,
    })
    .from(income)
    .where(eq(income.userId, userId))
    .orderBy(desc(income.date), desc(income.createdAt));

  const expenseRows = await db
    .select({
      id: expense.id,
      expenseType: expense.expenseType,
      amountMinor: expense.amountMinor,
      paidAt: expense.paidAt,
      vehicleLabel: vehicleProfile.label,
      notes: expense.notes,
      unitRateMinor: expense.unitRateMinor,
      unitRateUnit: expense.unitRateUnit,
      detailsJson: expense.detailsJson,
      createdAt: expense.createdAt,
    })
    .from(expense)
    .leftJoin(vehicleProfile, eq(expense.vehicleProfileId, vehicleProfile.id))
    .where(eq(expense.userId, userId))
    .orderBy(desc(expense.paidAt), desc(expense.createdAt));

  const combinedEntries = [
    ...incomeRows.map((entry) => ({
      type: 'income' as const,
      date: entry.date,
      category: entry.platform,
      amount: formatIncomeAmount(entry.amount),
      vehicleLabel: null,
      notes: null,
      unitRateMinor: null,
      unitRateUnit: null,
      detailsJson: null,
      createdAt: entry.createdAt,
      id: entry.id,
    })),
    ...expenseRows.map((entry) => ({
      type: 'expense' as const,
      date: entry.paidAt,
      category: entry.expenseType,
      amount: formatMinorAmount(entry.amountMinor),
      vehicleLabel: entry.vehicleLabel,
      notes: entry.notes,
      unitRateMinor: entry.unitRateMinor,
      unitRateUnit: entry.unitRateUnit,
      detailsJson: entry.detailsJson,
      createdAt: entry.createdAt,
      id: entry.id,
    })),
  ].sort((a, b) => {
    const dateDiff = toTimestamp(b.date) - toTimestamp(a.date);
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
  });

  const csv = buildCombinedCsv(combinedEntries);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="gigfin-data-export.csv"',
    },
  });
}
