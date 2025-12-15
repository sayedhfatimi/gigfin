import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { vehicleProfile } from '@/db/vehicle-profile-schema';
import { requireUserId } from '@/lib/server/session';

const VEHICLE_PROFILE_PATH = '/api/vehicle-profiles';

const VEHICLE_TYPES = ['EV', 'PETROL', 'DIESEL', 'HYBRID'] as const;

const clearDefaultVehicleProfile = async (userId: string) => {
  await db
    .update(vehicleProfile)
    .set({ isDefault: false })
    .where(
      and(
        eq(vehicleProfile.userId, userId),
        eq(vehicleProfile.isDefault, true),
      ),
    );
};

const createProfile = async (data: {
  userId: string;
  label: string;
  vehicleType: (typeof VEHICLE_TYPES)[number];
  isDefault: boolean;
}) => {
  const id = randomUUID();
  if (data.isDefault) {
    await clearDefaultVehicleProfile(data.userId);
  }
  const [entry] = await db
    .insert(vehicleProfile)
    .values({
      id,
      label: data.label,
      vehicleType: data.vehicleType,
      userId: data.userId,
      isDefault: data.isDefault,
      createdAt: new Date(),
    })
    .returning();
  return entry;
};

const updateProfile = async (data: {
  id: string;
  userId: string;
  label: string;
  vehicleType: (typeof VEHICLE_TYPES)[number];
  isDefault: boolean;
}) => {
  if (data.isDefault) {
    await clearDefaultVehicleProfile(data.userId);
  }
  const [entry] = await db
    .update(vehicleProfile)
    .set({
      label: data.label,
      vehicleType: data.vehicleType,
      isDefault: data.isDefault,
    })
    .where(
      and(
        eq(vehicleProfile.id, data.id),
        eq(vehicleProfile.userId, data.userId),
      ),
    )
    .returning();
  return entry ?? null;
};

const deleteProfile = async (id: string, userId: string) => {
  const deleted = await db
    .delete(vehicleProfile)
    .where(and(eq(vehicleProfile.id, id), eq(vehicleProfile.userId, userId)));
  return Boolean(deleted);
};

export async function GET(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const entries = await db
    .select()
    .from(vehicleProfile)
    .where(eq(vehicleProfile.userId, userId))
    .orderBy(desc(vehicleProfile.createdAt));

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const label = typeof body?.label === 'string' ? body.label.trim() : '';
  const vehicleType =
    typeof body?.vehicleType === 'string' &&
    VEHICLE_TYPES.includes(body.vehicleType as (typeof VEHICLE_TYPES)[number])
      ? (body.vehicleType as (typeof VEHICLE_TYPES)[number])
      : null;
  const isDefault = Boolean(body?.isDefault);

  if (!label || !vehicleType) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const entry = await createProfile({
    label,
    vehicleType,
    isDefault,
    userId,
  });

  return NextResponse.json(entry, {
    status: 201,
    headers: {
      Location: `${VEHICLE_PROFILE_PATH}/${entry.id}`,
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
  const label = typeof body?.label === 'string' ? body.label.trim() : '';
  const vehicleType =
    typeof body?.vehicleType === 'string' &&
    VEHICLE_TYPES.includes(body.vehicleType as (typeof VEHICLE_TYPES)[number])
      ? (body.vehicleType as (typeof VEHICLE_TYPES)[number])
      : null;
  const isDefault = Boolean(body?.isDefault);

  if (!id || !label || !vehicleType) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const entry = await updateProfile({
    id,
    label,
    vehicleType,
    isDefault,
    userId,
  });

  if (!entry) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
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

  const removed = await deleteProfile(id, userId);
  if (!removed) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ id });
}
