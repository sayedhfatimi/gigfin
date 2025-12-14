'use client';
import { type ChangeEvent, useEffect, useState } from 'react';
import { type ToastMessage, ToastStack } from '@/components/ToastStack';
import { useSession } from '@/lib/auth-client';
import type { CurrencyCode } from '@/lib/currency';
import { currencyOptions, resolveCurrency } from '@/lib/currency';
import { getSessionUser } from '@/lib/session';
import { ChangePasswordModal } from './_components/ChangePasswordModal';
import { TwoFactorModal } from './_components/TwoFactorModal';

export default function AccountPage() {
  const { data: sessionData, isPending, refetch } = useSession();
  const sessionUser = getSessionUser(sessionData);
  const sessionCurrency = resolveCurrency(sessionUser?.currency);
  const [selectedCurrency, setSelectedCurrency] =
    useState<CurrencyCode>(sessionCurrency);
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);
  const [statusMessage, setStatusMessage] = useState<ToastMessage | null>(null);
  const [isExportingIncome, setIsExportingIncome] = useState(false);
  useEffect(() => {
    setSelectedCurrency(sessionCurrency);
  }, [sessionCurrency]);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  useEffect(() => {
    if (!statusMessage) return;
    const timer = window.setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const handleCurrencyChange = async (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextCurrency = event.target.value as CurrencyCode;
    if (nextCurrency === selectedCurrency) {
      return;
    }
    const previousCurrency = selectedCurrency;
    setSelectedCurrency(nextCurrency);
    setStatusMessage(null);
    setIsUpdatingCurrency(true);
    try {
      const response = await fetch('/api/auth/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currency: nextCurrency }),
      });
      if (!response.ok) {
        throw new Error('Unable to update currency preference.');
      }
      await refetch();
      setStatusMessage({
        type: 'success',
        text: 'Currency preference saved.',
      });
    } catch (_error) {
      setSelectedCurrency(previousCurrency);
      setStatusMessage({
        type: 'error',
        text: 'Unable to save currency. Try again in a moment.',
      });
    } finally {
      setIsUpdatingCurrency(false);
    }
  };

  const handleExportIncomeCsv = async () => {
    setIsExportingIncome(true);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/export/incomes', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Unable to export income data.');
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = 'gigfin-income-export.csv';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
      setStatusMessage({
        type: 'success',
        text: 'Income data download started.',
      });
    } catch (_error) {
      setStatusMessage({
        type: 'error',
        text: 'Unable to export income data right now. Try again soon.',
      });
    } finally {
      setIsExportingIncome(false);
    }
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
    <>
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
                <p className='text-xs uppercase text-base-content/50'>
                  Security
                </p>
                <p className='text-sm text-base-content/60'>
                  Keep your authentication choices up to date.
                </p>
              </div>
              <span className='text-xs font-semibold text-base-content/60 text-right'>
                {isTwoFactorEnabled
                  ? 'Two-factor enabled'
                  : 'Two-factor disabled'}
              </span>
            </div>
            <div className='mt-6 space-y-4'>
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

        <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-xs uppercase text-base-content/50'>User</p>
              <h2 className='text-sm text-base-content/60'>
                Customize settings for your workspace.
              </h2>
            </div>
          </div>
          <div className='mt-6 space-y-4'>
            <div className='flex flex-col gap-3 rounded border border-base-content/10 px-4 py-5 md:flex-row md:items-center md:justify-between'>
              <div className='space-y-1'>
                <p className='text-xs uppercase text-base-content/50'>
                  Default currency
                </p>
                <p className='text-sm text-base-content/60'>
                  This currency controls how values appear throughout your
                  workspace.
                </p>
              </div>
              <div className='w-full max-w-xs'>
                <label className='sr-only' htmlFor='default-currency'>
                  Default currency
                </label>
                <select
                  id='default-currency'
                  className='select w-full'
                  value={selectedCurrency}
                  onChange={handleCurrencyChange}
                  disabled={isUpdatingCurrency}
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-xs uppercase text-base-content/50'>
                Export data
              </p>
              <h2 className='text-sm text-base-content/60'>
                Download a copy of your logged income for backup or review.
              </h2>
            </div>
          </div>
          <div className='mt-6 space-y-4'>
            <div className='flex flex-col gap-3 rounded border border-base-content/10 px-4 py-5 md:flex-row md:items-center md:justify-between'>
              <div className='space-y-1'>
                <p className='text-xs uppercase text-base-content/50'>
                  Income logs
                </p>
                <p className='text-sm text-base-content/60'>
                  Export every logged income entry as a CSV file.
                </p>
              </div>
              <button
                type='button'
                className='btn btn-primary text-sm font-semibold'
                onClick={handleExportIncomeCsv}
                disabled={isExportingIncome}
              >
                {isExportingIncome ? 'Preparing CSV…' : 'Export income CSV'}
              </button>
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
      <ToastStack
        pendingMessage={isUpdatingCurrency ? 'Saving preference…' : undefined}
        statusMessage={statusMessage}
      />
    </>
  );
}
