'use client';
import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useEffect,
  useState,
} from 'react';
import { type ToastMessage, ToastStack } from '@/components/ToastStack';
import { useSession } from '@/lib/auth-client';
import type { CurrencyCode } from '@/lib/currency';
import { currencyOptions, resolveCurrency } from '@/lib/currency';
import {
  useCreateVehicleProfile,
  useDeleteVehicleProfile,
  useUpdateVehicleProfile,
  useVehicleProfiles,
} from '@/lib/queries/vehicleProfiles';
import { getSessionUser } from '@/lib/session';
import { type VehicleProfile, vehicleTypeOptions } from '@/lib/vehicle';
import { ChangePasswordModal } from './_components/ChangePasswordModal';
import { TwoFactorModal } from './_components/TwoFactorModal';
import VehicleProfileModal from './_components/VehicleProfileModal';

const UNIT_SYSTEM_OPTIONS = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'Imperial' },
];

const VOLUME_UNIT_OPTIONS = [
  { value: 'litre', label: 'Litres' },
  { value: 'gallon_us', label: 'Gallons (US)' },
  { value: 'gallon_imp', label: 'Gallons (Imperial)' },
];

const vehicleTypeLabelByValue = new Map(
  vehicleTypeOptions.map((option) => [option.value, option.label]),
);

export default function AccountPage() {
  const { data: sessionData, isPending, refetch } = useSession();
  const sessionUser = getSessionUser(sessionData);
  const sessionCurrency = resolveCurrency(sessionUser?.currency);
  const resolvedUnitSystem = (() => {
    const unitSystem = sessionUser?.unitSystem;
    return typeof unitSystem === 'string' ? unitSystem : 'metric';
  })();
  const resolvedVolumeUnit = (() => {
    const volumeUnit = sessionUser?.volumeUnit;
    return typeof volumeUnit === 'string' ? volumeUnit : 'litre';
  })();

  const [selectedCurrency, setSelectedCurrency] =
    useState<CurrencyCode>(sessionCurrency);
  const [selectedUnitSystem, setSelectedUnitSystem] =
    useState(resolvedUnitSystem);
  const [selectedVolumeUnit, setSelectedVolumeUnit] =
    useState(resolvedVolumeUnit);
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);
  const [isUpdatingUnitSystem, setIsUpdatingUnitSystem] = useState(false);
  const [isUpdatingVolumeUnit, setIsUpdatingVolumeUnit] = useState(false);
  const [statusMessage, setStatusMessage] = useState<ToastMessage | null>(null);
  const [isExportingIncome, setIsExportingIncome] = useState(false);
  const [isExportingExpense, setIsExportingExpense] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const { data: vehicleProfiles = [], isLoading: isLoadingVehicleProfiles } =
    useVehicleProfiles();
  const createVehicleProfileMutation = useCreateVehicleProfile();
  const updateVehicleProfileMutation = useUpdateVehicleProfile();
  const deleteVehicleProfileMutation = useDeleteVehicleProfile();
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicleProfile, setEditingVehicleProfile] =
    useState<VehicleProfile | null>(null);

  const isVehicleProfileSaving =
    createVehicleProfileMutation.isPending ||
    updateVehicleProfileMutation.isPending;

  useEffect(() => {
    setSelectedCurrency(sessionCurrency);
    setSelectedUnitSystem(resolvedUnitSystem);
    setSelectedVolumeUnit(resolvedVolumeUnit);
  }, [sessionCurrency, resolvedUnitSystem, resolvedVolumeUnit]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }
    const timer = window.setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const updateUserPreference = async <T extends string>(
    payload: Record<string, string>,
    previousValue: T,
    setValue: Dispatch<SetStateAction<T>>,
    setIsUpdating: (value: boolean) => void,
    successText: string,
    errorText: string,
  ) => {
    setIsUpdating(true);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/auth/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Unable to update user preference.');
      }
      await refetch();
      setStatusMessage({ type: 'success', text: successText });
    } catch {
      setValue(previousValue);
      setStatusMessage({ type: 'error', text: errorText });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCurrencyChange = async (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextCurrency = event.target.value as CurrencyCode;
    if (nextCurrency === selectedCurrency) {
      return;
    }
    const previousCurrency = selectedCurrency;
    setSelectedCurrency(nextCurrency);
    await updateUserPreference(
      { currency: nextCurrency },
      previousCurrency,
      setSelectedCurrency,
      setIsUpdatingCurrency,
      'Currency preference saved.',
      'Unable to save currency. Try again in a moment.',
    );
  };

  const handleUnitSystemChange = async (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextUnitSystem = event.target.value;
    if (nextUnitSystem === selectedUnitSystem) {
      return;
    }
    const previousUnitSystem = selectedUnitSystem;
    setSelectedUnitSystem(nextUnitSystem);
    await updateUserPreference(
      { unitSystem: nextUnitSystem },
      previousUnitSystem,
      setSelectedUnitSystem,
      setIsUpdatingUnitSystem,
      'Unit system saved.',
      'Unable to save unit system. Try again in a moment.',
    );
  };

  const handleVolumeUnitChange = async (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextVolumeUnit = event.target.value;
    if (nextVolumeUnit === selectedVolumeUnit) {
      return;
    }
    const previousVolumeUnit = selectedVolumeUnit;
    setSelectedVolumeUnit(nextVolumeUnit);
    await updateUserPreference(
      { volumeUnit: nextVolumeUnit },
      previousVolumeUnit,
      setSelectedVolumeUnit,
      setIsUpdatingVolumeUnit,
      'Volume unit saved.',
      'Unable to save volume unit. Try again in a moment.',
    );
  };

  const handleVehicleProfileSubmit = (payload: {
    label: string;
    vehicleType: VehicleProfile['vehicleType'];
    isDefault: boolean;
  }) => {
    setStatusMessage(null);
    if (editingVehicleProfile) {
      updateVehicleProfileMutation.mutate(
        { ...payload, id: editingVehicleProfile.id },
        {
          onSuccess: () => {
            handleCloseVehicleModal();
            setStatusMessage({
              type: 'success',
              text: 'Vehicle profile updated.',
            });
          },
          onError: () =>
            setStatusMessage({
              type: 'error',
              text: 'Unable to save vehicle profile. Try again shortly.',
            }),
        },
      );
      return;
    }
    createVehicleProfileMutation.mutate(payload, {
      onSuccess: () => {
        handleCloseVehicleModal();
        setStatusMessage({
          type: 'success',
          text: 'Vehicle profile created.',
        });
      },
      onError: () =>
        setStatusMessage({
          type: 'error',
          text: 'Unable to save vehicle profile. Try again shortly.',
        }),
    });
  };

  const handleOpenVehicleModal = (profile?: VehicleProfile) => {
    setEditingVehicleProfile(profile ?? null);
    setIsVehicleModalOpen(true);
  };

  const handleCloseVehicleModal = () => {
    setIsVehicleModalOpen(false);
    setEditingVehicleProfile(null);
  };

  const handleSetDefaultVehicleProfile = (profile: VehicleProfile) => {
    if (profile.isDefault) {
      return;
    }
    setStatusMessage(null);
    updateVehicleProfileMutation.mutate(
      {
        id: profile.id,
        label: profile.label,
        vehicleType: profile.vehicleType,
        isDefault: true,
      },
      {
        onSuccess: () => {
          setStatusMessage({
            type: 'success',
            text: 'Default vehicle saved.',
          });
        },
        onError: () => {
          setStatusMessage({
            type: 'error',
            text: 'Unable to set default vehicle. Try again shortly.',
          });
        },
      },
    );
  };

  const handleDeleteVehicleProfile = (profile: VehicleProfile) => {
    const confirmed = window.confirm(
      'Remove this vehicle profile? Any linked expenses will keep a reference to the label.',
    );
    if (!confirmed) {
      return;
    }
    setStatusMessage(null);
    deleteVehicleProfileMutation.mutate(
      { id: profile.id },
      {
        onSuccess: () => {
          setStatusMessage({
            type: 'success',
            text: 'Vehicle profile removed.',
          });
        },
        onError: () => {
          setStatusMessage({
            type: 'error',
            text: 'Unable to delete vehicle profile. Try again shortly.',
          });
        },
      },
    );
  };

  type DownloadCsvConfig = {
    path: string;
    filename: string;
    setLoading: (value: boolean) => void;
    successText: string;
    errorText: string;
  };

  const downloadCsv = async ({
    path,
    filename,
    setLoading,
    successText,
    errorText,
  }: DownloadCsvConfig) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const response = await fetch(path, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Unable to export data.');
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
      setStatusMessage({
        type: 'success',
        text: successText,
      });
    } catch (_error) {
      setStatusMessage({
        type: 'error',
        text: errorText,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportIncomeCsv = () => {
    void downloadCsv({
      path: '/api/export/incomes',
      filename: 'gigfin-income-export.csv',
      setLoading: setIsExportingIncome,
      successText: 'Income data download started.',
      errorText: 'Unable to export income data right now. Try again soon.',
    });
  };

  const handleExportExpenseCsv = () => {
    void downloadCsv({
      path: '/api/export/expenses',
      filename: 'gigfin-expense-export.csv',
      setLoading: setIsExportingExpense,
      successText: 'Expense data download started.',
      errorText: 'Unable to export expense data right now. Try again soon.',
    });
  };

  const handleExportAllDataCsv = () => {
    void downloadCsv({
      path: '/api/export/all',
      filename: 'gigfin-data-export.csv',
      setLoading: setIsExportingAll,
      successText: 'All data download started.',
      errorText: 'Unable to export data right now. Try again soon.',
    });
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
              <p className='text-xs uppercase text-base-content/50'>
                Workspace settings
              </p>
              <h2 className='text-sm text-base-content/60'>
                Customize currency, volume units, and the workspace experience.
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
                  This currency controls how values appear in your workspace.
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
            <div className='flex flex-col gap-3 rounded border border-base-content/10 px-4 py-5 md:flex-row md:items-center md:justify-between'>
              <div className='space-y-1'>
                <p className='text-xs uppercase text-base-content/50'>
                  Unit system
                </p>
                <p className='text-sm text-base-content/60'>
                  Choose Metric for litres or Imperial for gallons.
                </p>
              </div>
              <div className='w-full max-w-xs'>
                <label className='sr-only' htmlFor='unit-system'>
                  Unit system
                </label>
                <select
                  id='unit-system'
                  className='select w-full'
                  value={selectedUnitSystem}
                  onChange={handleUnitSystemChange}
                  disabled={isUpdatingUnitSystem}
                >
                  {UNIT_SYSTEM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='flex flex-col gap-3 rounded border border-base-content/10 px-4 py-5 md:flex-row md:items-center md:justify-between'>
              <div className='space-y-1'>
                <p className='text-xs uppercase text-base-content/50'>
                  Volume unit
                </p>
                <p className='text-sm text-base-content/60'>
                  Select litres or the gallon type you prefer for ICE.
                </p>
              </div>
              <div className='w-full max-w-xs'>
                <label className='sr-only' htmlFor='volume-unit'>
                  Volume unit
                </label>
                <select
                  id='volume-unit'
                  className='select w-full'
                  value={selectedVolumeUnit}
                  onChange={handleVolumeUnitChange}
                  disabled={isUpdatingVolumeUnit}
                >
                  {VOLUME_UNIT_OPTIONS.map((option) => (
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
                Vehicle profiles
              </p>
              <h2 className='text-sm text-base-content/60'>
                Manage vehicles that will drive your expense tracking.
              </h2>
            </div>
            <button
              type='button'
              className='btn btn-primary text-sm font-semibold'
              onClick={() => handleOpenVehicleModal()}
            >
              Add vehicle profile
            </button>
          </div>
          <div className='mt-6 space-y-4'>
            {isLoadingVehicleProfiles ? (
              <p className='text-sm text-base-content/60'>
                Loading vehicle profiles…
              </p>
            ) : vehicleProfiles.length === 0 ? (
              <div className='flex flex-col gap-3 rounded border border-base-content/10 px-4 py-5 text-sm text-base-content/60'>
                <p>No vehicle profiles yet.</p>
                <button
                  type='button'
                  className='btn btn-sm btn-outline text-xs normal-case'
                  onClick={() => handleOpenVehicleModal()}
                >
                  Create your first profile
                </button>
              </div>
            ) : (
              <div className='space-y-3'>
                {vehicleProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className='rounded-2xl border border-base-content/10 bg-base-200 p-4 shadow-sm'
                  >
                    <div className='flex items-center justify-between gap-4'>
                      <div>
                        <p className='text-sm font-semibold text-base-content'>
                          {profile.label}
                        </p>
                        <p className='text-xs uppercase text-base-content/60'>
                          {vehicleTypeLabelByValue.get(profile.vehicleType) ??
                            profile.vehicleType}
                        </p>
                      </div>
                      {profile.isDefault && (
                        <span className='badge badge-sm badge-primary'>
                          Default
                        </span>
                      )}
                    </div>
                    <div className='mt-3 flex flex-wrap gap-2'>
                      <button
                        type='button'
                        className='btn btn-xs btn-outline'
                        disabled={isVehicleProfileSaving}
                        onClick={() => handleOpenVehicleModal(profile)}
                      >
                        Edit
                      </button>
                      {!profile.isDefault && (
                        <button
                          type='button'
                          className='btn btn-xs btn-primary'
                          onClick={() =>
                            handleSetDefaultVehicleProfile(profile)
                          }
                          disabled={updateVehicleProfileMutation.isPending}
                        >
                          Set default
                        </button>
                      )}
                      <button
                        type='button'
                        className='btn btn-xs btn-outline btn-error'
                        onClick={() => handleDeleteVehicleProfile(profile)}
                        disabled={deleteVehicleProfileMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-xs uppercase text-base-content/50'>
                Export data
              </p>
              <h2 className='text-sm text-base-content/60'>
                Download copies of your income and expense history for backup or
                review.
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
            <div className='flex flex-col gap-3 rounded border border-base-content/10 px-4 py-5 md:flex-row md:items-center md:justify-between'>
              <div className='space-y-1'>
                <p className='text-xs uppercase text-base-content/50'>
                  Expense logs
                </p>
                <p className='text-sm text-base-content/60'>
                  Export every logged expense entry as a CSV file.
                </p>
              </div>
              <button
                type='button'
                className='btn btn-primary text-sm font-semibold'
                onClick={handleExportExpenseCsv}
                disabled={isExportingExpense}
              >
                {isExportingExpense ? 'Preparing CSV…' : 'Export expense CSV'}
              </button>
            </div>
            <div className='flex flex-col gap-3 rounded border border-base-content/10 px-4 py-5 md:flex-row md:items-center md:justify-between'>
              <div className='space-y-1'>
                <p className='text-xs uppercase text-base-content/50'>
                  All data
                </p>
                <p className='text-sm text-base-content/60'>
                  Download every income and expense entry in one combined CSV.
                </p>
              </div>
              <button
                type='button'
                className='btn btn-primary text-sm font-semibold'
                onClick={handleExportAllDataCsv}
                disabled={isExportingAll}
              >
                {isExportingAll ? 'Preparing CSV…' : 'Export all data CSV'}
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

        <VehicleProfileModal
          isOpen={isVehicleModalOpen}
          profile={editingVehicleProfile}
          isSubmitting={isVehicleProfileSaving}
          onClose={handleCloseVehicleModal}
          onSubmit={handleVehicleProfileSubmit}
        />
      </div>
      <ToastStack
        pendingMessage={
          isUpdatingCurrency || isUpdatingUnitSystem || isUpdatingVolumeUnit
            ? 'Saving preference…'
            : undefined
        }
        statusMessage={statusMessage}
      />
    </>
  );
}
