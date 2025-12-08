'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { signOut, useSession } from '@/lib/auth-client';
import { getSessionUser } from '@/lib/session';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'fa-chart-line' },
  { label: 'Logs', href: '/logs', icon: 'fa-table' },
  { label: 'Account', href: '/account', icon: 'fa-user' },
];

export default function AuthedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: sessionData, isPending } = useSession();
  const sessionUser = getSessionUser(sessionData);
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!isPending && !sessionUser) {
      router.replace('/');
    }
  }, [isPending, router, sessionUser]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    router.replace('/');
  };

  if (isPending || !sessionUser) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-base-200 text-base-content'>
        <div className='loading loading-dots loading-lg'>
          <output className='sr-only' aria-live='polite'>
            Loading your workspace…
          </output>
        </div>
      </div>
    );
  }

  const isActive = (href: string) =>
    pathname ? pathname.startsWith(href) : false;

  return (
    <ReactQueryProvider>
      <div className='flex min-h-screen bg-base-200 text-base-content'>
        <aside className='hidden w-72 flex-col gap-6 border-r border-base-content/10 bg-base-100 p-6 py-10 shadow-sm lg:flex lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto bottom-0'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.4em] text-base-content/60'>
              GigFin
            </p>
            <p className='text-2xl font-semibold text-base-content'>
              Workspace
            </p>
          </div>
          <div className='space-y-1 text-sm text-base-content/70'>
            <p className='font-semibold text-base-content'>
              {sessionUser?.name ?? sessionUser?.email ?? 'Gig Worker'}
            </p>
            <p className='text-xs'>{sessionUser?.email}</p>
          </div>
          <nav className='flex flex-1 flex-col gap-2'>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`btn btn-ghost justify-start gap-3 text-sm font-semibold transition ${
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-base-content/80 hover:bg-base-200'
                }`}
              >
                <span
                  className={`fa-solid ${item.icon} text-base-content/70`}
                />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className='flex w-full items-center justify-end gap-3'>
            <button
              type='button'
              aria-label='Sign out'
              className='btn btn-square btn-sm'
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <span
                aria-hidden='true'
                className='fa-solid fa-arrow-right-from-bracket text-base-content/70'
              />
            </button>
            <ThemeToggle />
          </div>
        </aside>
        <div className='flex flex-1 flex-col'>
          <div className='lg:hidden'>
            <div className='flex w-full gap-2 overflow-x-auto border-b border-base-content/10 bg-base-100 p-4'>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`btn btn-sm btn-ghost justify-start gap-3 rounded-md text-xs font-semibold ${
                    isActive(item.href)
                      ? 'border border-primary/30 bg-primary/10 text-primary'
                      : 'text-base-content/70'
                  }`}
                >
                  <span className={`fa-solid ${item.icon}`} />
                  {item.label}
                </Link>
              ))}
            </div>
            <div className='border-b border-base-content/10 bg-base-100 p-4'>
              <div className='flex w-full items-center justify-end gap-3'>
                <button
                  type='button'
                  aria-label='Sign out'
                  className='btn btn-square btn-sm'
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  <span
                    aria-hidden='true'
                    className='fa-solid fa-arrow-right-from-bracket text-base-content/70'
                  />
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>
          <div className='flex-1 overflow-hidden'>
            <main className='h-full overflow-y-auto px-4 pb-10 pt-6 lg:px-10'>
              {children}
            </main>
          </div>
        </div>
      </div>
    </ReactQueryProvider>
  );
}
