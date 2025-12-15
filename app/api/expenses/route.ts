import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { expense } from '@/db/expense-schema';
import { vehicleProfile } from '@/db/vehicle-profile-schema';
import { requireUserId } from '@/lib/server/session';

const EXPENSE_PATH = '/api/expenses';
const UNIT_RATE_UNITS = ['kwh', 'litre', 'gallon_us', 'gallon_imp'] as const;
type UnitRateUnit = (typeof UNIT_RATE_UNITS)[number];

const parseInteger = (value: unknown) => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return null;
    }
    return Math.round(parsed);
  }
  return null;
};

const parseUnitRateUnit = (value: unknown) => {
  if (typeof value !== 'string') {
    return null;
  }
  return UNIT_RATE_UNITS.includes(value as UnitRateUnit)
    ? (value as UnitRateUnit)
    : null;
};

const parseDetailsJson = (value: unknown) => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

const normalizeVehicleProfileId = (value: unknown) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  return value;
};

const buildExpensePayload = (body: unknown) => {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const record = body as Record<string, unknown>;
  const expenseType =
    typeof record.expenseType === 'string' ? record.expenseType.trim() : '';
  const paidAt = typeof record.paidAt === 'string' ? record.paidAt.trim() : '';
  const amountMinor = parseInteger(record.amountMinor);
  if (!expenseType || !paidAt || amountMinor === null || amountMinor <= 0) {
    return null;
  }
  const unitRateMinor =
    record.unitRateMinor === undefined
      ? null
      : parseInteger(record.unitRateMinor);
  const unitRateUnit = parseUnitRateUnit(record.unitRateUnit);
  const notes =
    typeof record.notes === 'string' && record.notes.trim()
      ? record.notes.trim()
      : null;
  const vehicleProfileId = normalizeVehicleProfileId(record.vehicleProfileId);
  const detailsJson = parseDetailsJson(record.detailsJson);

  return {
    expenseType,
    amountMinor,
    paidAt,
    unitRateMinor,
    unitRateUnit,
    notes,
    vehicleProfileId,
    detailsJson,
  };
};

type ExpensePayload = NonNullable<ReturnType<typeof buildExpensePayload>>;

const createExpense = async (data: { userId: string; doc: ExpensePayload }) => {
  const id = randomUUID();
  const [entry] = await db
    .insert(expense)
    .values({
      id,
      userId: data.userId,
      expenseType: data.doc.expenseType,
      amountMinor: data.doc.amountMinor,
      paidAt: data.doc.paidAt,
      unitRateMinor: data.doc.unitRateMinor,
      unitRateUnit: data.doc.unitRateUnit,
      notes: data.doc.notes,
      vehicleProfileId: data.doc.vehicleProfileId,
      detailsJson: data.doc.detailsJson,
      createdAt: new Date(),
    })
    .returning();
  return entry;
};

const updateExpense = async (data: {
  id: string;
  userId: string;
  doc: ExpensePayload;
}) => {
  const [entry] = await db
    .update(expense)
    .set({
      expenseType: data.doc.expenseType,
      amountMinor: data.doc.amountMinor,
      paidAt: data.doc.paidAt,
      unitRateMinor: data.doc.unitRateMinor,
      unitRateUnit: data.doc.unitRateUnit,
      notes: data.doc.notes,
      vehicleProfileId: data.doc.vehicleProfileId,
      detailsJson: data.doc.detailsJson,
    })
    .where(and(eq(expense.id, data.id), eq(expense.userId, data.userId)))
    .returning();
  return entry ?? null;
};

const deleteExpense = async (id: string, userId: string) => {
  const deleted = await db
    .delete(expense)
    .where(and(eq(expense.id, id), eq(expense.userId, userId)));
  return Boolean(deleted);
};

const hydrateExpense = (row: {
  id: string;
  userId: string;
  expenseType: string;
  amountMinor: number;
  paidAt: string;
  vehicleProfileId: string | null;
  notes: string | null;
  unitRateMinor: number | null;
  unitRateUnit: UnitRateUnit | null;
  detailsJson: string | null;
  createdAt: Date;
  updatedAt: Date;
  vehicleLabel?: string | null;
  vehicleType?: string | null;
}) => {
  const { vehicleLabel, vehicleType, ...base } = row;
  return {
    ...base,
    vehicle: base.vehicleProfileId
      ? {
          id: base.vehicleProfileId,
          label: vehicleLabel ?? undefined,
          vehicleType: (vehicleType as string) ?? undefined,
        }
      : null,
  };
};

export async function GET(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select({
      id: expense.id,
      userId: expense.userId,
      expenseType: expense.expenseType,
      amountMinor: expense.amountMinor,
      paidAt: expense.paidAt,
      vehicleProfileId: expense.vehicleProfileId,
      notes: expense.notes,
      unitRateMinor: expense.unitRateMinor,
      unitRateUnit: expense.unitRateUnit,
      detailsJson: expense.detailsJson,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      vehicleLabel: vehicleProfile.label,
      vehicleType: vehicleProfile.vehicleType,
    })
    .from(expense)
    .leftJoin(vehicleProfile, eq(expense.vehicleProfileId, vehicleProfile.id))
    .where(eq(expense.userId, userId))
    .orderBy(desc(expense.paidAt), desc(expense.createdAt));

  const entries = rows.map((row) =>
    hydrateExpense({
      ...row,
      unitRateUnit: parseUnitRateUnit(row.unitRateUnit),
    }),
  );
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const payload = buildExpensePayload(body);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const entry = await createExpense({ userId, doc: payload });
  return NextResponse.json(entry, {
    status: 201,
    headers: {
      Location: `${EXPENSE_PATH}/${entry.id}`,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  const payload = buildExpensePayload(body);
  if (!id || !payload) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const entry = await updateExpense({ id, userId, doc: payload });
  if (!entry) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
  }

  return NextResponse.json(entry);
}

export async function DELETE(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!id) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const removed = await deleteExpense(id, userId);
  if (!removed) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
  }

  return NextResponse.json({ id });
}
