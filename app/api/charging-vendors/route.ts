import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { chargingVendor } from '@/db/charging-vendor-schema';
import { requireUserId } from '@/lib/server/session';

const CHARGING_VENDOR_PATH = '/api/charging-vendors';
const UNIT_RATE_UNITS = ['kwh'] as const;
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

const buildVendorPayload = (body: unknown) => {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const record = body as Record<string, unknown>;
  const label = typeof record.label === 'string' ? record.label.trim() : '';
  const unitRateMinor = parseInteger(record.unitRateMinor ?? record.rate);
  const unitRateUnit = parseUnitRateUnit(record.unitRateUnit);
  if (!label || unitRateMinor === null || unitRateMinor <= 0 || !unitRateUnit) {
    return null;
  }
  return {
    label,
    unitRateMinor,
    unitRateUnit,
  };
};

const createVendor = async (data: {
  userId: string;
  label: string;
  unitRateMinor: number;
  unitRateUnit: UnitRateUnit;
}) => {
  const id = randomUUID();
  const [vendor] = await db
    .insert(chargingVendor)
    .values({
      id,
      userId: data.userId,
      label: data.label,
      unitRateMinor: data.unitRateMinor,
      unitRateUnit: data.unitRateUnit,
      createdAt: new Date(),
    })
    .returning();
  return vendor;
};

const updateVendor = async (data: {
  userId: string;
  id: string;
  doc: {
    label: string;
    unitRateMinor: number;
    unitRateUnit: UnitRateUnit;
  };
}) => {
  const [vendor] = await db
    .update(chargingVendor)
    .set({
      label: data.doc.label,
      unitRateMinor: data.doc.unitRateMinor,
      unitRateUnit: data.doc.unitRateUnit,
    })
    .where(
      and(
        eq(chargingVendor.id, data.id),
        eq(chargingVendor.userId, data.userId),
      ),
    )
    .returning();
  return vendor ?? null;
};

const deleteVendor = async (id: string, userId: string) => {
  const removed = await db
    .delete(chargingVendor)
    .where(and(eq(chargingVendor.id, id), eq(chargingVendor.userId, userId)));
  return Boolean(removed);
};

export async function GET(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const entries = await db
    .select()
    .from(chargingVendor)
    .where(eq(chargingVendor.userId, userId))
    .orderBy(desc(chargingVendor.createdAt));

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const payload = buildVendorPayload(body);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const entry = await createVendor({
    ...payload,
    userId,
  });

  return NextResponse.json(entry, {
    status: 201,
    headers: {
      Location: `${CHARGING_VENDOR_PATH}/${entry.id}`,
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
  const payload = buildVendorPayload(body);
  if (!id || !payload) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const entry = await updateVendor({
    id,
    userId,
    doc: payload,
  });
  if (!entry) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
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

  const removed = await deleteVendor(id, userId);
  if (!removed) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  }

  return NextResponse.json({ id });
}
