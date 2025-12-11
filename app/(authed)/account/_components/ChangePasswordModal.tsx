'use client';
import { type FormEvent, useState } from 'react';
import { changePassword } from '@/lib/auth-client';
import { StatusAlerts } from './StatusAlerts';

type ChangePasswordModalProps = {
  onClose: () => void;
};

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <div className='modal modal-open'>
      <div className='modal-box max-w-3xl relative'>
        <div>
          <h3 className='text-lg font-semibold text-base-content'>
            Change password
          </h3>
          <p className='text-sm text-base-content/60'>
            Strengthen access by rotating your password regularly.
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
          <div className='space-y-2'>
            <p className='text-xs uppercase text-base-content/50'>
              Update credentials
            </p>
            <h4 className='text-sm font-semibold text-base-content'>
              Change it safely
            </h4>
          </div>
          <form className='mt-3 space-y-4' onSubmit={handleChangePassword}>
            <div className='grid gap-2'>
              <label className='input w-full'>
                <input
                  id='currentPassword'
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder='Current password'
                  autoComplete='current-password'
                  required
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
                <button
                  type='button'
                  aria-pressed={showCurrentPassword}
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className={`btn btn-ghost btn-xs btn-square text-xs text-base-content/70 swap swap-rotate p-0 ${
                    showCurrentPassword ? 'swap-active' : ''
                  }`}
                >
                  <i
                    className='fa-solid fa-eye-slash swap-on'
                    aria-hidden='true'
                  />
                  <i className='fa-solid fa-eye swap-off' aria-hidden='true' />
                </button>
              </label>
            </div>
            <div className='grid gap-2'>
              <label className='input w-full'>
                <input
                  id='newPassword'
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder='New password'
                  autoComplete='new-password'
                  minLength={8}
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <button
                  type='button'
                  aria-pressed={showNewPassword}
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className={`btn btn-ghost btn-xs btn-square text-xs text-base-content/70 swap swap-rotate p-0 ${
                    showNewPassword ? 'swap-active' : ''
                  }`}
                >
                  <i
                    className='fa-solid fa-eye-slash swap-on'
                    aria-hidden='true'
                  />
                  <i className='fa-solid fa-eye swap-off' aria-hidden='true' />
                </button>
              </label>
            </div>
            <div className='grid gap-2'>
              <label className='input w-full'>
                <input
                  id='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder='Confirm new password'
                  autoComplete='new-password'
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <button
                  type='button'
                  aria-pressed={showConfirmPassword}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className={`btn btn-ghost btn-xs btn-square text-xs text-base-content/70 swap swap-rotate p-0 ${
                    showConfirmPassword ? 'swap-active' : ''
                  }`}
                >
                  <i
                    className='fa-solid fa-eye-slash swap-on'
                    aria-hidden='true'
                  />
                  <i className='fa-solid fa-eye swap-off' aria-hidden='true' />
                </button>
              </label>
            </div>
            <StatusAlerts
              message={passwordChangeMessage}
              error={passwordChangeError}
            />
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
      </div>
    </div>
  );
}
