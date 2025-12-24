import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { odometer } from '@/db/odometer-schema';
import { vehicleProfile } from '@/db/vehicle-profile-schema';
import { requireUserId } from '@/lib/server/session';

const ODOMETERS_PATH = '/api/odometers';

const parseReading = (value: unknown) => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return null;
    }
    return parsed;
  }
  return null;
};

const normalizeVehicleProfileId = (value: unknown) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  return value;
};

const buildPayload = (body: unknown) => {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const record = body as Record<string, unknown>;
  const date = typeof record.date === 'string' ? record.date.trim() : '';
  const startReading = parseReading(record.startReading);
  const endReading = parseReading(record.endReading);
  if (
    !date ||
    startReading === null ||
    endReading === null ||
    startReading < 0 ||
    endReading < 0 ||
    endReading < startReading
  ) {
    return null;
  }
  return {
    date,
    startReading,
    endReading,
    vehicleProfileId: normalizeVehicleProfileId(record.vehicleProfileId),
  };
};

type OdometerPayload = NonNullable<ReturnType<typeof buildPayload>>;

const createOdometer = async (data: {
  userId: string;
  doc: OdometerPayload;
}) => {
  const id = randomUUID();
  const [entry] = await db
    .insert(odometer)
    .values({
      id,
      userId: data.userId,
      date: data.doc.date,
      startReading: data.doc.startReading,
      endReading: data.doc.endReading,
      vehicleProfileId: data.doc.vehicleProfileId,
      notes: null,
      createdAt: new Date(),
    })
    .returning();
  return entry;
};

const updateOdometer = async (data: {
  id: string;
  userId: string;
  doc: OdometerPayload;
}) => {
  const [entry] = await db
    .update(odometer)
    .set({
      date: data.doc.date,
      startReading: data.doc.startReading,
      endReading: data.doc.endReading,
      vehicleProfileId: data.doc.vehicleProfileId,
    })
    .where(and(eq(odometer.id, data.id), eq(odometer.userId, data.userId)))
    .returning();
  return entry ?? null;
};

const deleteOdometer = async (id: string, userId: string) => {
  const deleted = await db
    .delete(odometer)
    .where(and(eq(odometer.id, id), eq(odometer.userId, userId)));
  return Boolean(deleted);
};

const hydrateOdometer = (row: {
  id: string;
  userId: string;
  date: string;
  startReading: number;
  endReading: number;
  vehicleProfileId: string | null;
  notes: string | null;
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
      id: odometer.id,
      userId: odometer.userId,
      date: odometer.date,
      startReading: odometer.startReading,
      endReading: odometer.endReading,
      vehicleProfileId: odometer.vehicleProfileId,
      notes: odometer.notes,
      createdAt: odometer.createdAt,
      updatedAt: odometer.updatedAt,
      vehicleLabel: vehicleProfile.label,
      vehicleType: vehicleProfile.vehicleType,
    })
    .from(odometer)
    .leftJoin(vehicleProfile, eq(odometer.vehicleProfileId, vehicleProfile.id))
    .where(eq(odometer.userId, userId))
    .orderBy(desc(odometer.date), desc(odometer.createdAt));

  const entries = rows.map((row) =>
    hydrateOdometer({
      ...row,
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
  const payload = buildPayload(body);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const entry = await createOdometer({ userId, doc: payload });
  return NextResponse.json(entry, {
    status: 201,
    headers: {
      Location: `${ODOMETERS_PATH}/${entry.id}`,
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
  const payload = buildPayload(body);
  if (!id || !payload) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const entry = await updateOdometer({ id, userId, doc: payload });
  if (!entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
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

  const removed = await deleteOdometer(id, userId);
  if (!removed) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  return NextResponse.json({ id });
}
