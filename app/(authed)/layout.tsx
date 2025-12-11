'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import { signOut, useSession } from '@/lib/auth-client';
import { getSessionUser } from '@/lib/session';
import Nav from './_components/Nav';

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
        <Nav
          sessionUser={sessionUser}
          isSigningOut={isSigningOut}
          onSignOut={handleSignOut}
          isActive={isActive}
        />
        <div className='flex flex-1 flex-col'>
          <div className='flex-1 overflow-hidden'>
            <main className='h-full overflow-y-auto px-4 pb-24 pt-6 lg:px-10'>
              {children}
            </main>
          </div>
          <div className='lg:hidden'>
            <Nav
              variant='mobile'
              sessionUser={sessionUser}
              isSigningOut={isSigningOut}
              onSignOut={handleSignOut}
              isActive={isActive}
            />
          </div>
        </div>
      </div>
    </ReactQueryProvider>
  );
}
