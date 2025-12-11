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
                <span className='label'>Current password</span>
                <input
                  id='currentPassword'
                  type='password'
                  autoComplete='current-password'
                  required
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </label>
            </div>
            <div className='grid gap-2'>
              <label className='input w-full'>
                <span className='label'>New password</span>
                <input
                  id='newPassword'
                  type='password'
                  autoComplete='new-password'
                  minLength={8}
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </label>
            </div>
            <div className='grid gap-2'>
              <label className='input w-full'>
                <span className='label'>Confirm new password</span>
                <input
                  id='confirmPassword'
                  type='password'
                  autoComplete='new-password'
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
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
        <div className='modal-action justify-end'>
          <button type='button' className='btn btn-ghost' onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
