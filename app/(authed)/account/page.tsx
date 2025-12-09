'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import QRCode from 'react-qr-code';

import {
  authClient,
  changePassword,
  signOut,
  useSession,
} from '@/lib/auth-client';
import { getSessionUser } from '@/lib/session';

export default function AccountPage() {
  const { data: sessionData, isPending } = useSession();
  const sessionUser = getSessionUser(sessionData);
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [twoFactorOtp, setTwoFactorOtp] = useState('');
  const [twoFactorSetup, setTwoFactorSetup] = useState<{
    totpURI: string;
    backupCodes: string[];
  } | null>(null);
  const [pendingBackupCodes, setPendingBackupCodes] = useState<string[]>([]);
  const [twoFactorStatusMessage, setTwoFactorStatusMessage] = useState('');
  const [twoFactorStatusError, setTwoFactorStatusError] = useState('');
  const [isRequestingTwoFactor, setIsRequestingTwoFactor] = useState(false);
  const [isVerifyingTwoFactor, setIsVerifyingTwoFactor] = useState(false);
  const [disableTwoFactorPassword, setDisableTwoFactorPassword] = useState('');
  const [isDisablingTwoFactor, setIsDisablingTwoFactor] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    router.replace('/');
  };

  const copyToClipboard = async (value: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore copy errors
    }
  };

  const openTwoFactorModal = () => setIsTwoFactorModalOpen(true);
  const closeTwoFactorModal = () => setIsTwoFactorModalOpen(false);
  const openPasswordModal = () => setIsPasswordModalOpen(true);
  const closePasswordModal = () => setIsPasswordModalOpen(false);

  const renderStatusAlerts = () => (
    <>
      {twoFactorStatusMessage && (
        <p className='text-sm font-semibold uppercase  text-success'>
          {twoFactorStatusMessage}
        </p>
      )}
      {twoFactorStatusError && (
        <p className='text-sm font-semibold uppercase  text-error'>
          {twoFactorStatusError}
        </p>
      )}
    </>
  );

  const handleStartTwoFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTwoFactorStatusMessage('');
    setTwoFactorStatusError('');
    if (!twoFactorPassword) {
      setTwoFactorStatusError('Enter your password to proceed.');
      return;
    }
    setIsRequestingTwoFactor(true);
    try {
      const response = await authClient.twoFactor.enable({
        password: twoFactorPassword,
      });
      if (!response.data) {
        throw new Error(
          response.error?.message ?? 'Unable to start two-factor setup.',
        );
      }
      const { totpURI, backupCodes } = response.data;
      setTwoFactorSetup({ totpURI, backupCodes });
      setPendingBackupCodes(backupCodes);
      setTwoFactorStatusMessage(
        'Scan the QR code or copy the URI, then enter the generated code to complete setup.',
      );
    } catch (error) {
      setTwoFactorStatusError(
        error instanceof Error
          ? error.message
          : 'Unable to start two-factor setup.',
      );
    } finally {
      setIsRequestingTwoFactor(false);
      setTwoFactorPassword('');
    }
  };

  const handleVerifyTwoFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTwoFactorStatusMessage('');
    setTwoFactorStatusError('');
    if (!twoFactorOtp) {
      setTwoFactorStatusError('Enter the code from your authenticator app.');
      return;
    }
    setIsVerifyingTwoFactor(true);
    try {
      await authClient.twoFactor.verifyTotp({
        code: twoFactorOtp,
      });
      setTwoFactorSetup(null);
      setTwoFactorStatusMessage('Two-factor authentication enabled.');
      setTwoFactorOtp('');
      router.refresh();
    } catch (error) {
      setTwoFactorStatusError(
        error instanceof Error ? error.message : 'Unable to verify the code.',
      );
    } finally {
      setIsVerifyingTwoFactor(false);
    }
  };

  const handleDisableTwoFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTwoFactorStatusMessage('');
    setTwoFactorStatusError('');
    if (!disableTwoFactorPassword) {
      setTwoFactorStatusError(
        'Enter your password to disable two-factor authentication.',
      );
      return;
    }
    setIsDisablingTwoFactor(true);
    try {
      await authClient.twoFactor.disable({
        password: disableTwoFactorPassword,
      });
      setTwoFactorStatusMessage('Two-factor authentication disabled.');
      setPendingBackupCodes([]);
      setTwoFactorSetup(null);
      setDisableTwoFactorPassword('');
      router.refresh();
    } catch (error) {
      setTwoFactorStatusError(
        error instanceof Error
          ? error.message
          : 'Unable to disable two-factor authentication.',
      );
    } finally {
      setIsDisablingTwoFactor(false);
    }
  };

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

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordChangeMessage('');
    setPasswordChangeError('');
    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New passwords must match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      setPasswordChangeMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error instanceof Error) {
        setPasswordChangeError(error.message);
      } else {
        setPasswordChangeError('Unable to change password.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

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
          <div className='mt-3 space-y-2'>{renderStatusAlerts()}</div>
        </div>
      </section>

      {isTwoFactorModalOpen && (
        <div className='modal modal-open'>
          <div className='modal-box max-w-3xl'>
            <div>
              <h3 className='text-lg font-semibold text-base-content'>
                Two-factor authentication
              </h3>
              <p className='text-sm text-base-content/60'>
                Protect your account with an extra verification step.
              </p>
            </div>
            <section className='mt-6 rounded border border-base-content/10 p-4 bg-base-300'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='text-xs uppercase  text-base-content/50'>
                    Setup status
                  </p>
                  <p className='text-sm text-base-content/60'>
                    {isTwoFactorEnabled
                      ? 'Two-factor authentication is protecting your account.'
                      : 'Two-factor authentication is currently off.'}
                  </p>
                </div>
                <span className='text-xs font-semibold uppercase  text-base-content/50'>
                  {isTwoFactorEnabled ? 'Protected' : 'Off'}
                </span>
              </div>
              <div className='mt-4 space-y-4'>
                <div className='space-y-2'>{renderStatusAlerts()}</div>
                {!isTwoFactorEnabled ? (
                  <form className='space-y-3' onSubmit={handleStartTwoFactor}>
                    <div className='grid gap-2'>
                      <label
                        htmlFor='twoFactorPassword'
                        className='text-xs uppercase  text-base-content/50'
                      >
                        Confirm password
                      </label>
                      <input
                        id='twoFactorPassword'
                        type='password'
                        autoComplete='current-password'
                        required
                        value={twoFactorPassword}
                        onChange={(event) =>
                          setTwoFactorPassword(event.target.value)
                        }
                        className='input w-full rounded-md border border-base-content/10 bg-base-50 px-3 text-sm text-base-content placeholder:text-base-content/40 focus:border-primary focus:outline-none'
                      />
                    </div>
                    <button
                      type='submit'
                      className={`btn btn-primary w-full text-sm font-semibold ${
                        isRequestingTwoFactor ? 'loading' : ''
                      }`}
                      disabled={isRequestingTwoFactor}
                    >
                      Enable two-factor
                    </button>
                  </form>
                ) : (
                  <form className='space-y-3' onSubmit={handleDisableTwoFactor}>
                    <div className='grid gap-2'>
                      <label
                        htmlFor='disableTwoFactorPassword'
                        className='text-xs uppercase  text-base-content/50'
                      >
                        Confirm password
                      </label>
                      <input
                        id='disableTwoFactorPassword'
                        type='password'
                        autoComplete='current-password'
                        required
                        value={disableTwoFactorPassword}
                        onChange={(event) =>
                          setDisableTwoFactorPassword(event.target.value)
                        }
                        className='input w-full rounded-md border border-base-content/10 bg-base-50 px-3 text-sm text-base-content placeholder:text-base-content/40 focus:border-primary focus:outline-none'
                      />
                    </div>
                    <button
                      type='submit'
                      className={`btn btn-error w-full text-sm font-semibold ${
                        isDisablingTwoFactor ? 'loading' : ''
                      }`}
                      disabled={isDisablingTwoFactor}
                    >
                      Disable two-factor
                    </button>
                  </form>
                )}
                {twoFactorSetup && (
                  <div className='space-y-4 rounded border border-base-content/10 p-4'>
                    <p className='text-xs uppercase  text-base-content/50'>
                      Complete setup
                    </p>
                    <div className='flex flex-col items-center gap-3'>
                      <div className='rounded-md border border-base-content/20 bg-base-100 p-4 text-base-content'>
                        <QRCode
                          value={twoFactorSetup.totpURI}
                          size={200}
                          bgColor='transparent'
                          fgColor='currentColor'
                          className='h-40 w-40'
                        />
                      </div>
                      <div className='flex w-full items-center justify-between gap-2 rounded bg-base-200 px-3 py-2 text-[11px] uppercase  text-base-content/60'>
                        <span className='truncate'>
                          {twoFactorSetup.totpURI}
                        </span>
                        <button
                          type='button'
                          className='text-xs font-semibold text-primary underline-offset-4 hover:underline'
                          onClick={() =>
                            copyToClipboard(twoFactorSetup.totpURI)
                          }
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <form
                      className='space-y-3'
                      onSubmit={handleVerifyTwoFactor}
                    >
                      <div className='grid gap-2'>
                        <label
                          htmlFor='twoFactorOtp'
                          className='text-xs uppercase  text-base-content/50'
                        >
                          Authentication code
                        </label>
                        <input
                          id='twoFactorOtp'
                          type='text'
                          inputMode='numeric'
                          pattern='[0-9]*'
                          minLength={6}
                          maxLength={10}
                          required
                          value={twoFactorOtp}
                          onChange={(event) =>
                            setTwoFactorOtp(event.target.value)
                          }
                          className='input w-full rounded-md border border-base-content/10 bg-base-50 px-3 text-sm text-base-content placeholder:text-base-content/40 focus:border-primary focus:outline-none'
                        />
                      </div>
                      <button
                        type='submit'
                        className={`btn btn-secondary w-full text-sm font-semibold ${
                          isVerifyingTwoFactor ? 'loading' : ''
                        }`}
                        disabled={isVerifyingTwoFactor}
                      >
                        Confirm code
                      </button>
                    </form>
                  </div>
                )}
                {pendingBackupCodes.length > 0 && (
                  <div className='space-y-2 rounded border border-base-content/10 p-3 text-xs uppercase  text-base-content/60'>
                    <div className='flex items-center justify-between'>
                      <span>Backup codes</span>
                      <button
                        type='button'
                        className='text-primary underline-offset-4 hover:underline'
                        onClick={() =>
                          copyToClipboard(pendingBackupCodes.join('\n'))
                        }
                      >
                        Copy all
                      </button>
                    </div>
                    <div className='grid gap-2 text-[11px] font-mono'>
                      {pendingBackupCodes.map((code) => (
                        <span
                          key={code}
                          className='rounded bg-base-200 px-2 py-1 text-[11px]'
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
            <div className='modal-action justify-end'>
              <button
                type='button'
                className='btn btn-ghost'
                onClick={closeTwoFactorModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className='modal modal-open'>
          <div className='modal-box max-w-3xl'>
            <div>
              <h3 className='text-lg font-semibold text-base-content'>
                Change password
              </h3>
              <p className='text-sm text-base-content/60'>
                Strengthen access by rotating your password regularly.
              </p>
            </div>
            <section className='mt-6 rounded border border-base-content/10 p-4 bg-base-300'>
              <div className='space-y-2'>
                <p className='text-xs uppercase  text-base-content/50'>
                  Update credentials
                </p>
                <h4 className='text-sm font-semibold text-base-content'>
                  Change it safely
                </h4>
              </div>
              <form className='mt-3 space-y-4' onSubmit={handleChangePassword}>
                <div className='grid gap-2'>
                  <label
                    htmlFor='currentPassword'
                    className='text-xs uppercase  text-base-content/50'
                  >
                    Current password
                  </label>
                  <input
                    id='currentPassword'
                    type='password'
                    autoComplete='current-password'
                    required
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className='input w-full rounded-md border border-base-content/10 bg-base-50 px-3 text-sm text-base-content placeholder:text-base-content/40 focus:border-primary focus:outline-none'
                  />
                </div>
                <div className='grid gap-2'>
                  <label
                    htmlFor='newPassword'
                    className='text-xs uppercase  text-base-content/50'
                  >
                    New password
                  </label>
                  <input
                    id='newPassword'
                    type='password'
                    autoComplete='new-password'
                    minLength={8}
                    required
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className='input w-full rounded-md border border-base-content/10 bg-base-50 px-3 text-sm text-base-content placeholder:text-base-content/40 focus:border-primary focus:outline-none'
                  />
                </div>
                <div className='grid gap-2'>
                  <label
                    htmlFor='confirmPassword'
                    className='text-xs uppercase  text-base-content/50'
                  >
                    Confirm new password
                  </label>
                  <input
                    id='confirmPassword'
                    type='password'
                    autoComplete='new-password'
                    minLength={8}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className='input w-full rounded-md border border-base-content/10 bg-base-50 px-3 text-sm text-base-content placeholder:text-base-content/40 focus:border-primary focus:outline-none'
                  />
                </div>
                {passwordChangeMessage && (
                  <p className='text-sm font-semibold uppercase  text-success'>
                    {passwordChangeMessage}
                  </p>
                )}
                {passwordChangeError && (
                  <p className='text-sm font-semibold uppercase  text-error'>
                    {passwordChangeError}
                  </p>
                )}
                <div className='flex justify-end'>
                  <button
                    type='submit'
                    className={`btn btn-primary text-sm font-semibold ${
                      isChangingPassword ? 'loading' : ''
                    }`}
                    disabled={isChangingPassword}
                  >
                    Update password
                  </button>
                </div>
              </form>
            </section>
            <div className='modal-action justify-end'>
              <button
                type='button'
                className='btn btn-ghost'
                onClick={closePasswordModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
