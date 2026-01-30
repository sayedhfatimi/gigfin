'use client';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { StatusAlerts } from './StatusAlerts';

type Passkey = {
  id: string;
  name: string | null;
  createdAt: Date;
  deviceType: string;
};

type PasskeyModalProps = {
  onClose: () => void;
};

export function PasskeyModal({ onClose }: PasskeyModalProps) {
  const router = useRouter();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');

  // Add passkey states
  const [isAddingPasskey, setIsAddingPasskey] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');

  // Edit passkey states
  const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(null);
  const [editPasskeyName, setEditPasskeyName] = useState('');
  const [isUpdatingPasskey, setIsUpdatingPasskey] = useState(false);

  // Delete passkey states
  const [deletingPasskeyId, setDeletingPasskeyId] = useState<string | null>(
    null,
  );
  const [isDeletingPasskey, setIsDeletingPasskey] = useState(false);

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

  // Load passkeys on mount
  useEffect(() => {
    const loadPasskeys = async () => {
      setIsLoading(true);
      try {
        const response = await authClient.passkey.listUserPasskeys();
        if (response.data) {
          setPasskeys(response.data as Passkey[]);
        }
      } catch {
        setStatusError('Failed to load passkeys.');
      } finally {
        setIsLoading(false);
      }
    };
    loadPasskeys();
  }, []);

  const handleAddPasskey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage('');
    setStatusError('');
    setIsAddingPasskey(true);

    try {
      const response = await authClient.passkey.addPasskey({
        name: newPasskeyName || undefined,
      });

      if (response.error) {
        setStatusError(response.error.message || 'Failed to add passkey.');
        return;
      }

      setStatusMessage('Passkey added successfully.');
      setNewPasskeyName('');

      // Refresh the list
      const listResponse = await authClient.passkey.listUserPasskeys();
      if (listResponse.data) {
        setPasskeys(listResponse.data as Passkey[]);
      }
      router.refresh();
    } catch (error) {
      setStatusError(
        error instanceof Error ? error.message : 'Failed to add passkey.',
      );
    } finally {
      setIsAddingPasskey(false);
    }
  };

  const handleUpdatePasskey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPasskeyId) return;

    setStatusMessage('');
    setStatusError('');
    setIsUpdatingPasskey(true);

    try {
      const response = await authClient.passkey.updatePasskey({
        id: editingPasskeyId,
        name: editPasskeyName,
      });

      if (response.error) {
        setStatusError(response.error.message || 'Failed to update passkey.');
        return;
      }

      setStatusMessage('Passkey renamed successfully.');
      setEditingPasskeyId(null);
      setEditPasskeyName('');

      // Refresh the list
      const listResponse = await authClient.passkey.listUserPasskeys();
      if (listResponse.data) {
        setPasskeys(listResponse.data as Passkey[]);
      }
      router.refresh();
    } catch (error) {
      setStatusError(
        error instanceof Error ? error.message : 'Failed to update passkey.',
      );
    } finally {
      setIsUpdatingPasskey(false);
    }
  };

  const handleDeletePasskey = async () => {
    if (!deletingPasskeyId) return;

    setStatusMessage('');
    setStatusError('');
    setIsDeletingPasskey(true);

    try {
      const response = await authClient.passkey.deletePasskey({
        id: deletingPasskeyId,
      });

      if (response.error) {
        setStatusError(response.error.message || 'Failed to delete passkey.');
        return;
      }

      setStatusMessage('Passkey deleted successfully.');
      setDeletingPasskeyId(null);

      // Refresh the list
      const listResponse = await authClient.passkey.listUserPasskeys();
      if (listResponse.data) {
        setPasskeys(listResponse.data as Passkey[]);
      }
      router.refresh();
    } catch (error) {
      setStatusError(
        error instanceof Error ? error.message : 'Failed to delete passkey.',
      );
    } finally {
      setIsDeletingPasskey(false);
    }
  };

  const startEditPasskey = (passkey: Passkey) => {
    setEditingPasskeyId(passkey.id);
    setEditPasskeyName(passkey.name || '');
    setDeletingPasskeyId(null);
  };

  const cancelEditPasskey = () => {
    setEditingPasskeyId(null);
    setEditPasskeyName('');
  };

  const startDeletePasskey = (passkeyId: string) => {
    setDeletingPasskeyId(passkeyId);
    setEditingPasskeyId(null);
  };

  const cancelDeletePasskey = () => {
    setDeletingPasskeyId(null);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'singleDevice':
        return 'fa-mobile-screen';
      case 'multiDevice':
        return 'fa-cloud';
      default:
        return 'fa-key';
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
      <div className='modal-box max-w-lg relative overflow-visible'>
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
          <span className='text-xl text-primary'>
            <i className='fa-solid fa-fingerprint' />
          </span>
          <div>
            <h3 className='text-lg font-semibold text-base-content'>
              Passkey management
            </h3>
            <p className='text-sm text-base-content/60'>
              Add, rename, or remove passkeys for passwordless sign-in.
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className='mt-4 flex items-center justify-between rounded-lg border border-base-content/10 bg-base-200 p-3'>
          <div className='flex items-center gap-2'>
            <i
              className={`fa-solid ${
                passkeys.length > 0
                  ? 'fa-shield-check text-success'
                  : 'fa-shield text-base-content/40'
              }`}
            />
            <span className='text-sm text-base-content/70'>
              {passkeys.length > 0
                ? `${passkeys.length} passkey${
                    passkeys.length !== 1 ? 's' : ''
                  } registered`
                : 'No passkeys registered yet'}
            </span>
          </div>
          <span
            className={`badge badge-sm ${
              passkeys.length > 0 ? 'badge-primary' : 'badge-ghost'
            } gap-1`}
          >
            <i
              className={`fa-solid ${
                passkeys.length > 0 ? 'fa-check' : 'fa-minus'
              } text-xs`}
            />
            {passkeys.length > 0 ? 'Active' : 'None'}
          </span>
        </div>

        <div className='mt-4 space-y-4'>
          <StatusAlerts message={statusMessage} error={statusError} />

          {/* Add passkey form */}
          <form onSubmit={handleAddPasskey} className='space-y-3'>
            <label className='input w-full'>
              <span className='label text-xs uppercase text-base-content/50'>
                <i className='fa-solid fa-tag text-base-content/40 mr-1' />
                Passkey name
              </span>
              <input
                type='text'
                placeholder='e.g. MacBook Touch ID'
                value={newPasskeyName}
                onChange={(e) => setNewPasskeyName(e.target.value)}
                disabled={isAddingPasskey}
              />
            </label>
            <button
              type='submit'
              className='btn btn-primary gap-2 w-full'
              disabled={isAddingPasskey}
            >
              {isAddingPasskey ? (
                <span className='loading loading-spinner loading-sm' />
              ) : (
                <i className='fa-solid fa-plus' />
              )}
              {isAddingPasskey ? 'Adding passkey…' : 'Add passkey'}
            </button>
          </form>

          {/* Passkeys list */}
          {isLoading ? (
            <div className='flex items-center gap-2 text-sm text-base-content/60 py-4'>
              <span className='loading loading-spinner loading-sm' />
              Loading passkeys…
            </div>
          ) : passkeys.length > 0 ? (
            <div className='space-y-2'>
              <p className='text-xs uppercase text-base-content/50'>
                Your passkeys
              </p>
              <div className='space-y-2'>
                {passkeys.map((passkey) => (
                  <div
                    key={passkey.id}
                    className='rounded-lg border border-base-content/10 bg-base-200 p-3'
                  >
                    {editingPasskeyId === passkey.id ? (
                      <form
                        onSubmit={handleUpdatePasskey}
                        className='space-y-2'
                      >
                        <label className='input input-sm w-full'>
                          <input
                            type='text'
                            value={editPasskeyName}
                            onChange={(e) => setEditPasskeyName(e.target.value)}
                            placeholder='Passkey name'
                            required
                            disabled={isUpdatingPasskey}
                          />
                        </label>
                        <div className='flex gap-2'>
                          <button
                            type='submit'
                            className='btn btn-sm btn-primary gap-1'
                            disabled={isUpdatingPasskey}
                          >
                            {isUpdatingPasskey ? (
                              <span className='loading loading-spinner loading-xs' />
                            ) : (
                              <i className='fa-solid fa-check text-xs' />
                            )}
                            Save
                          </button>
                          <button
                            type='button'
                            className='btn btn-sm btn-ghost'
                            onClick={cancelEditPasskey}
                            disabled={isUpdatingPasskey}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : deletingPasskeyId === passkey.id ? (
                      <div className='space-y-2'>
                        <p className='text-sm text-error'>
                          Delete this passkey? This action cannot be undone.
                        </p>
                        <div className='flex gap-2'>
                          <button
                            type='button'
                            className='btn btn-sm btn-error gap-1'
                            onClick={handleDeletePasskey}
                            disabled={isDeletingPasskey}
                          >
                            {isDeletingPasskey ? (
                              <span className='loading loading-spinner loading-xs' />
                            ) : (
                              <i className='fa-solid fa-trash text-xs' />
                            )}
                            Delete
                          </button>
                          <button
                            type='button'
                            className='btn btn-sm btn-ghost'
                            onClick={cancelDeletePasskey}
                            disabled={isDeletingPasskey}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <i
                            className={`fa-solid ${getDeviceIcon(
                              passkey.deviceType,
                            )} text-primary`}
                          />
                          <div>
                            <p className='text-sm font-medium text-base-content'>
                              {passkey.name || 'Unnamed passkey'}
                            </p>
                            <p className='text-xs text-base-content/50'>
                              Added {formatDate(passkey.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className='flex gap-1'>
                          <button
                            type='button'
                            className='btn btn-sm btn-ghost btn-square'
                            onClick={() => startEditPasskey(passkey)}
                            aria-label='Rename passkey'
                          >
                            <i className='fa-solid fa-pen text-xs' />
                          </button>
                          <button
                            type='button'
                            className='btn btn-sm btn-ghost btn-square text-error'
                            onClick={() => startDeletePasskey(passkey.id)}
                            aria-label='Delete passkey'
                          >
                            <i className='fa-solid fa-trash text-xs' />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
