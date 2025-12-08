type SessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  [key: string]: unknown;
};

type SessionLike = {
  user?: SessionUser;
  session?: {
    user?: SessionUser;
    userId?: string;
  };
  userId?: string;
};

export const getSessionUser = (
  sessionData?: SessionLike | null,
): SessionUser | null =>
  sessionData?.user ?? sessionData?.session?.user ?? null;

export const getSessionUserId = (
  sessionData?: SessionLike | null,
): string | null =>
  sessionData?.user?.id ??
  sessionData?.session?.user?.id ??
  sessionData?.userId ??
  sessionData?.session?.userId ??
  null;
