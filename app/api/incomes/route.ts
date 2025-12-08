import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { income } from '@/db/schema';

const SESSION_PATH = '/api/auth/get-session';
const INCOME_PATH = '/api/incomes';

const getSessionFromRequest = async (request: NextRequest) => {
  const url = new URL(request.url);
  url.pathname = SESSION_PATH;
  url.search = '';

  const headers = new Headers(request.headers);
  headers.delete('host');

  const sessionResponse = await fetch(url.toString(), {
    method: 'GET',
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

  if (!sessionResponse.ok) {
    return null;
  }

  return (await sessionResponse.json()) as {
    user?: { id?: string };
  } | null;
};

const requireUserId = async (request: NextRequest) => {
  const session = await getSessionFromRequest(request);
  return session?.user?.id ?? null;
};

const createEntry = async (data: {
  platform: string;
  date: string;
  amount: number;
  userId: string;
}) => {
  const id = randomUUID();
  const [entry] = await db
    .insert(income)
    .values({
      id,
      platform: data.platform,
      date: data.date,
      amount: data.amount,
      userId: data.userId,
      createdAt: new Date(),
    })
    .returning();
  return entry;
};

const updateEntry = async (data: {
  id: string;
  platform: string;
  date: string;
  amount: number;
  userId: string;
}) => {
  const [entry] = await db
    .update(income)
    .set({
      platform: data.platform,
      date: data.date,
      amount: data.amount,
    })
    .where(and(eq(income.id, data.id), eq(income.userId, data.userId)))
    .returning();
  return entry ?? null;
};

const deleteEntry = async (id: string, userId: string) => {
  const deleted = await db
    .delete(income)
    .where(and(eq(income.id, id), eq(income.userId, userId)));
  return Boolean(deleted);
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

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const platform =
    typeof body?.platform === 'string' ? body.platform.trim() : '';
  const date = typeof body?.date === 'string' ? body.date : '';
  const amount =
    typeof body?.amount === 'number' ? body.amount : Number(body?.amount);

  if (!platform || !date || Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const entry = await createEntry({
    platform,
    date,
    amount,
    userId,
  });

  return NextResponse.json(entry, {
    status: 201,
    headers: {
      Location: `${INCOME_PATH}/${entry.id}`,
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
  const platform =
    typeof body?.platform === 'string' ? body.platform.trim() : '';
  const date = typeof body?.date === 'string' ? body.date : '';
  const amount =
    typeof body?.amount === 'number' ? body.amount : Number(body?.amount);

  if (!id || !platform || !date || Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const entry = await updateEntry({
    id,
    platform,
    date,
    amount,
    userId,
  });

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

  const removed = await deleteEntry(id, userId);
  if (!removed) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  return NextResponse.json({ id });
}
