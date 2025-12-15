import { desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { expense } from '@/db/expense-schema';
import { vehicleProfile } from '@/db/vehicle-profile-schema';
import { requireUserId } from '@/lib/server/session';

import { escapeCsvValue, formatDateValue, formatMinorAmount } from '../utils';

const buildExpenseCsv = (
  entries: {
    id: string;
    expenseType: string;
    amountMinor: number;
    paidAt: string | Date | number;
    unitRateMinor: number | null;
    unitRateUnit: string | null;
    vehicleLabel: string | null;
    notes: string | null;
    detailsJson: string | null;
    createdAt: string | Date | number;
  }[],
): string => {
  const header = [
    'Date',
    'Expense type',
    'Amount',
    'Unit rate minor',
    'Unit rate unit',
    'Vehicle label',
    'Notes',
    'Details JSON',
    'Created At',
    'Entry ID',
  ];
  const rows = entries.map((entry) => [
    formatDateValue(entry.paidAt),
    entry.expenseType,
    formatMinorAmount(entry.amountMinor),
    entry.unitRateMinor ?? '',
    entry.unitRateUnit ?? '',
    entry.vehicleLabel ?? '',
    entry.notes ?? '',
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

  const entries = await db
    .select({
      id: expense.id,
      expenseType: expense.expenseType,
      amountMinor: expense.amountMinor,
      paidAt: expense.paidAt,
      unitRateMinor: expense.unitRateMinor,
      unitRateUnit: expense.unitRateUnit,
      notes: expense.notes,
      detailsJson: expense.detailsJson,
      createdAt: expense.createdAt,
      vehicleLabel: vehicleProfile.label,
    })
    .from(expense)
    .leftJoin(vehicleProfile, eq(expense.vehicleProfileId, vehicleProfile.id))
    .where(eq(expense.userId, userId))
    .orderBy(desc(expense.paidAt), desc(expense.createdAt));

  const csv = buildExpenseCsv(entries);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="gigfin-expense-export.csv"',
    },
  });
}
