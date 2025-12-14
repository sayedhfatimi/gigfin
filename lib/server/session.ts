import type { NextRequest } from 'next/server';

const SESSION_PATH = '/api/auth/get-session';
const INTERNAL_API_BASE =
  process.env.INTERNAL_API_BASE ?? 'http://127.0.0.1:3000';

type SessionResponse = {
  user?: { id?: string };
};

const getSessionUrl = () => new URL(SESSION_PATH, INTERNAL_API_BASE);

export const getSessionFromRequest = async (
  request: NextRequest,
): Promise<SessionResponse | null> => {
  const url = getSessionUrl();
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

  return (await sessionResponse.json()) as SessionResponse | null;
};

export const requireUserId = async (
  request: NextRequest,
): Promise<string | null> => {
  const session = await getSessionFromRequest(request);
  return session?.user?.id ?? null;
};
