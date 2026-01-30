'use client';
import { type FormEvent, useEffect, useState } from 'react';
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

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled via escape key effect */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop is a clickable overlay */}
      <div
        className='modal-backdrop bg-base-300/60 backdrop-blur-sm'
        onClick={onClose}
      />
      <div className='modal-box max-w-md relative overflow-visible'>
        {/* Close button */}
        <button
          type='button'
          className='btn btn-sm btn-circle btn-ghost absolute -right-2 -top-2 bg-base-100 shadow-md hover:bg-base-200'
          onClick={onClose}
          aria-label='Close modal'
        >
          <i className='fa-solid fa-xmark' />
        </button>

        {/* Header */}
        <div className='flex items-center gap-3 pb-4 border-b border-base-content/10'>
          <span className='text-xl text-warning'>
            <i className='fa-solid fa-lock' />
          </span>
          <div>
            <h3 className='text-lg font-semibold text-base-content'>
              Change password
            </h3>
            <p className='text-sm text-base-content/60'>
              Strengthen access by rotating your password regularly.
            </p>
          </div>
        </div>

        <form className='mt-6 space-y-4' onSubmit={handleChangePassword}>
          <label className='input w-full'>
            <span className='label text-xs uppercase text-base-content/50'>
              <i className='fa-solid fa-key text-base-content/40 mr-1' />
              Current password
            </span>
            <input
              id='currentPassword'
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder='Enter current password'
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
              <i className='fa-solid fa-eye-slash swap-on' aria-hidden='true' />
              <i className='fa-solid fa-eye swap-off' aria-hidden='true' />
            </button>
          </label>

          <label className='input w-full'>
            <span className='label text-xs uppercase text-base-content/50'>
              <i className='fa-solid fa-lock text-base-content/40 mr-1' />
              New password
            </span>
            <input
              id='newPassword'
              type={showNewPassword ? 'text' : 'password'}
              placeholder='Enter new password'
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
              <i className='fa-solid fa-eye-slash swap-on' aria-hidden='true' />
              <i className='fa-solid fa-eye swap-off' aria-hidden='true' />
            </button>
          </label>

          <label className='input w-full'>
            <span className='label text-xs uppercase text-base-content/50'>
              <i className='fa-solid fa-check-double text-base-content/40 mr-1' />
              Confirm password
            </span>
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
              <i className='fa-solid fa-eye-slash swap-on' aria-hidden='true' />
              <i className='fa-solid fa-eye swap-off' aria-hidden='true' />
            </button>
          </label>

          <StatusAlerts
            message={passwordChangeMessage}
            error={passwordChangeError}
          />

          <div className='modal-action pt-4 border-t border-base-content/10'>
            <button
              type='button'
              className='btn btn-ghost gap-2'
              onClick={onClose}
              disabled={isChangingPassword}
            >
              <i className='fa-solid fa-xmark' />
              Cancel
            </button>
            <button
              type='submit'
              className='btn btn-warning gap-2'
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <span className='loading loading-spinner loading-sm' />
              ) : (
                <i className='fa-solid fa-check' />
              )}
              Update password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
