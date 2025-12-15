import { desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { income } from '@/db/schema';
import { requireUserId } from '@/lib/server/session';

import { escapeCsvValue, formatDateValue } from '../utils';

const buildIncomeCsv = (
  entries: {
    id: string;
    platform: string;
    amount: number | null;
    date: string;
    createdAt: Date | string;
  }[],
): string => {
  const header = ['Date', 'Platform', 'Amount', 'Created At', 'Entry ID'];
  const rows = entries.map((entry) => [
    formatDateValue(entry.date),
    entry.platform,
    entry.amount ?? '',
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
    .select()
    .from(income)
    .where(eq(income.userId, userId))
    .orderBy(desc(income.date), desc(income.createdAt));

  const csv = buildIncomeCsv(entries);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="gigfin-income-export.csv"',
    },
  });
}
