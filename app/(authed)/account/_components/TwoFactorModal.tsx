'use client';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import QRCode from 'react-qr-code';
import { authClient } from '@/lib/auth-client';
import { StatusAlerts } from './StatusAlerts';

type TwoFactorSetup = {
  totpURI: string;
  backupCodes: string[];
};

type TwoFactorModalProps = {
  isTwoFactorEnabled: boolean;
  onClose: () => void;
};

export function TwoFactorModal({
  isTwoFactorEnabled,
  onClose,
}: TwoFactorModalProps) {
  const router = useRouter();
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [twoFactorOtp, setTwoFactorOtp] = useState('');
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(
    null,
  );
  const [pendingBackupCodes, setPendingBackupCodes] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');
  const [isRequestingTwoFactor, setIsRequestingTwoFactor] = useState(false);
  const [isVerifyingTwoFactor, setIsVerifyingTwoFactor] = useState(false);
  const [disableTwoFactorPassword, setDisableTwoFactorPassword] = useState('');
  const [isDisablingTwoFactor, setIsDisablingTwoFactor] = useState(false);
  const [showTwoFactorPassword, setShowTwoFactorPassword] = useState(false);
  const [showDisableTwoFactorPassword, setShowDisableTwoFactorPassword] =
    useState(false);

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

  const handleStartTwoFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage('');
    setStatusError('');
    if (!twoFactorPassword) {
      setStatusError('Enter your password to proceed.');
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
      setStatusMessage(
        'Scan the QR code or copy the URI, then enter the generated code to complete setup.',
      );
    } catch (error) {
      setStatusError(
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
    setStatusMessage('');
    setStatusError('');
    if (!twoFactorOtp) {
      setStatusError('Enter the code from your authenticator app.');
      return;
    }
    setIsVerifyingTwoFactor(true);
    try {
      await authClient.twoFactor.verifyTotp({
        code: twoFactorOtp,
      });
      setTwoFactorSetup(null);
      setStatusMessage('Two-factor authentication enabled.');
      setTwoFactorOtp('');
      router.refresh();
    } catch (error) {
      setStatusError(
        error instanceof Error ? error.message : 'Unable to verify the code.',
      );
    } finally {
      setIsVerifyingTwoFactor(false);
    }
  };

  const handleDisableTwoFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage('');
    setStatusError('');
    if (!disableTwoFactorPassword) {
      setStatusError(
        'Enter your password to disable two-factor authentication.',
      );
      return;
    }
    setIsDisablingTwoFactor(true);
    try {
      await authClient.twoFactor.disable({
        password: disableTwoFactorPassword,
      });
      setStatusMessage('Two-factor authentication disabled.');
      setPendingBackupCodes([]);
      setTwoFactorSetup(null);
      setDisableTwoFactorPassword('');
      router.refresh();
    } catch (error) {
      setStatusError(
        error instanceof Error
          ? error.message
          : 'Unable to disable two-factor authentication.',
      );
    } finally {
      setIsDisablingTwoFactor(false);
    }
  };

  return (
    <div className='modal modal-open'>
      <div className='modal-box max-w-3xl relative'>
        <div>
          <h3 className='text-lg font-semibold text-base-content'>
            Two-factor authentication
          </h3>
          <p className='text-sm text-base-content/60'>
            Protect your account with an extra verification step.
          </p>
        </div>
        <button
          type='button'
          aria-label='Close modal'
          className='btn btn-ghost btn-square absolute top-3 right-3 text-base-content/70'
          onClick={onClose}
        >
          <i className='fa-solid fa-xmark' aria-hidden='true' />
        </button>
        <section className='mt-6 rounded border border-base-content/10 p-4 bg-base-300'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='text-xs uppercase text-base-content/50'>
                Setup status
              </p>
              <p className='text-sm text-base-content/60'>
                {isTwoFactorEnabled
                  ? 'Two-factor authentication is protecting your account.'
                  : 'Two-factor authentication is currently off.'}
              </p>
            </div>
            <span className='text-xs font-semibold uppercase text-base-content/50'>
              {isTwoFactorEnabled ? 'Protected' : 'Off'}
            </span>
          </div>
          <div className='mt-4 space-y-4'>
            <div className='space-y-2'>
              <StatusAlerts message={statusMessage} error={statusError} />
            </div>
            {!isTwoFactorEnabled ? (
              <>
                {!twoFactorSetup && (
                  <form
                    className='space-y-3'
                    onSubmit={handleStartTwoFactor}
                  >
                    <div className='grid gap-2'>
                      <label className='input w-full validator'>
                        <input
                          id='twoFactorPassword'
                          type={showTwoFactorPassword ? 'text' : 'password'}
                          placeholder='Confirm password'
                          autoComplete='current-password'
                          required
                          value={twoFactorPassword}
                          onChange={(event) =>
                            setTwoFactorPassword(event.target.value)
                          }
                        />
                        <button
                          type='button'
                          aria-pressed={showTwoFactorPassword}
                          onClick={() =>
                            setShowTwoFactorPassword((prev) => !prev)
                          }
                          className={`btn btn-ghost btn-xs btn-square text-xs text-base-content/70 swap swap-rotate p-0 ${
                            showTwoFactorPassword ? 'swap-active' : ''
                          }`}
                        >
                          <i
                            className='fa-solid fa-eye-slash swap-on'
                            aria-hidden='true'
                          />
                          <i
                            className='fa-solid fa-eye swap-off'
                            aria-hidden='true'
                          />
                        </button>
                      </label>
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
                )}
              </>
            ) : (
              <form className='space-y-3' onSubmit={handleDisableTwoFactor}>
                <div className='grid gap-2'>
                  <label className='input w-full validator'>
                    <input
                      id='disableTwoFactorPassword'
                      type={showDisableTwoFactorPassword ? 'text' : 'password'}
                      placeholder='Confirm password'
                      autoComplete='current-password'
                      required
                      value={disableTwoFactorPassword}
                      onChange={(event) =>
                        setDisableTwoFactorPassword(event.target.value)
                      }
                    />
                    <button
                      type='button'
                      aria-pressed={showDisableTwoFactorPassword}
                      onClick={() =>
                        setShowDisableTwoFactorPassword((prev) => !prev)
                      }
                      className={`btn btn-ghost btn-xs btn-square text-xs text-base-content/70 swap swap-rotate p-0 ${
                        showDisableTwoFactorPassword ? 'swap-active' : ''
                      }`}
                    >
                      <i
                        className='fa-solid fa-eye-slash swap-on'
                        aria-hidden='true'
                      />
                      <i
                        className='fa-solid fa-eye swap-off'
                        aria-hidden='true'
                      />
                    </button>
                  </label>
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
                <p className='text-xs uppercase text-base-content/50'>
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
                  <div className='flex w-full items-center justify-between gap-2 rounded bg-base-200 px-3 py-2 text-[11px] uppercase text-base-content/60'>
                    <span className='truncate'>{twoFactorSetup.totpURI}</span>
                    <button
                      type='button'
                      className='text-xs font-semibold text-primary underline-offset-4 hover:underline'
                      onClick={() => copyToClipboard(twoFactorSetup.totpURI)}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <form className='space-y-3' onSubmit={handleVerifyTwoFactor}>
                  <div className='grid gap-2'>
                    <label className='input w-full'>
                      <span className='label'>TOTP</span>
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
                      />
                    </label>
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
              <div className='space-y-2 rounded border border-base-content/10 p-3 text-xs uppercase text-base-content/60'>
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
                <div className='grid grid-cols-1 gap-2 text-xs font-mono md:grid-cols-2'>
                  {pendingBackupCodes.map((code) => (
                    <span key={code} className='bg-base-200 px-2 py-1'>
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
