'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut, useSession } from '@/lib/auth-client';
import { getSessionUser } from '@/lib/session';
import { ChangePasswordModal } from './_components/ChangePasswordModal';
import { TwoFactorModal } from './_components/TwoFactorModal';

export default function AccountPage() {
  const { data: sessionData, isPending } = useSession();
  const sessionUser = getSessionUser(sessionData);
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    router.replace('/');
  };

  const openTwoFactorModal = () => setIsTwoFactorModalOpen(true);
  const closeTwoFactorModal = () => setIsTwoFactorModalOpen(false);
  const openPasswordModal = () => setIsPasswordModalOpen(true);
  const closePasswordModal = () => setIsPasswordModalOpen(false);

  if (isPending) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <div className='loading loading-dots loading-lg text-base-content'>
          Loading account…
        </div>
      </div>
    );
  }

  const isTwoFactorEnabled = Boolean(sessionUser?.twoFactorEnabled);

  return (
    <div className='space-y-6'>
      <header className='space-y-1'>
        <p className='text-xs uppercase  text-base-content/60'>Account</p>
        <h1 className='text-3xl font-semibold text-base-content'>Settings</h1>
        <p className='text-sm text-base-content/60'>
          Keep your login details and preferences tidy.
        </p>
      </header>

      <section className='grid gap-6 lg:grid-cols-2'>
        <div className=' border border-base-content/10 bg-base-100 p-6 shadow-sm'>
          <div className='flex items-center justify-between'>
            <p className='text-xs uppercase  text-base-content/50'>Session</p>
            <span className='text-xs font-semibold text-base-content/60'>
              Active
            </span>
          </div>
          <div className='mt-6 space-y-2'>
            <p className='text-sm text-base-content/70'>
              Name
              <span className='block text-base-content font-semibold'>
                {sessionUser?.name ?? 'Not set'}
              </span>
            </p>
            <p className='text-sm text-base-content/70'>
              Email
              <span className='block text-base-content font-semibold'>
                {sessionUser?.email ?? '—'}
              </span>
            </p>
          </div>
        </div>
        <div className=' border border-base-content/10 bg-base-100 p-6 shadow-sm'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs uppercase  text-base-content/50'>
                Security
              </p>
              <p className='text-sm text-base-content/60'>
                Keep your authentication choices up to date.
              </p>
            </div>
            <span className='text-xs font-semibold text-base-content/60'>
              {isTwoFactorEnabled
                ? 'Two-factor enabled'
                : 'Two-factor disabled'}
            </span>
          </div>
          <div className='mt-6 space-y-4'>
            <div className='flex flex-col gap-3 rounded border border-base-content/10 px-4 py-5 md:flex-row md:items-center md:justify-between'>
              <div className='space-y-1'>
                <p className='text-xs uppercase  text-base-content/50'>
                  Sign out
                </p>
                <p className='text-sm text-base-content/60'>
                  Signing out clears local income logs for this session.
                </p>
              </div>
              <button
                type='button'
                className={`btn btn-error text-sm font-semibold ${
                  isSigningOut ? 'loading' : ''
                }`}
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
            <div className='flex flex-col gap-3 rounded border border-base-content/10 px-4 py-5 md:flex-row md:items-center md:justify-between'>
              <div className='space-y-1'>
                <p className='text-xs uppercase  text-base-content/50'>
                  Two-factor authentication
                </p>
                <p className='text-sm text-base-content/60'>
                  Protect access to your account with an extra verification
                  step.
                </p>
              </div>
              <button
                type='button'
                className='btn btn-primary text-sm font-semibold'
                onClick={openTwoFactorModal}
              >
                Manage two-factor
              </button>
            </div>
            <div className='flex flex-col gap-3 rounded border border-base-content/10 px-4 py-5 md:flex-row md:items-center md:justify-between'>
              <div className='space-y-1'>
                <p className='text-xs uppercase  text-base-content/50'>
                  Password
                </p>
                <p className='text-sm text-base-content/60'>
                  Rotate your password whenever you need extra assurance.
                </p>
              </div>
              <button
                type='button'
                className='btn btn-secondary text-sm font-semibold'
                onClick={openPasswordModal}
              >
                Change password
              </button>
            </div>
          </div>
        </div>
      </section>

      {isTwoFactorModalOpen && (
        <TwoFactorModal
          isTwoFactorEnabled={isTwoFactorEnabled}
          onClose={closeTwoFactorModal}
        />
      )}

      {isPasswordModalOpen && (
        <ChangePasswordModal onClose={closePasswordModal} />
      )}
    </div>
  );
}
