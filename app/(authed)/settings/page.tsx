'use client';
import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { UAParser } from 'ua-parser-js';
import { type ToastMessage, ToastStack } from '@/components/ToastStack';
import { authClient, useSession } from '@/lib/auth-client';
import type { ChargingVendor } from '@/lib/charging-vendor';
import type { CurrencyCode } from '@/lib/currency';
import { currencyOptions, resolveCurrency } from '@/lib/currency';
import type { UnitRateUnit } from '@/lib/expenses';
import type { OdometerUnit } from '@/lib/odometer';
import {
  useChargingVendors,
  useCreateChargingVendor,
  useDeleteChargingVendor,
  useUpdateChargingVendor,
} from '@/lib/queries/chargingVendors';
import {
  useCreateVehicleProfile,
  useDeleteVehicleProfile,
  useUpdateVehicleProfile,
  useVehicleProfiles,
} from '@/lib/queries/vehicleProfiles';
import { getSessionUser } from '@/lib/session';
import { type VehicleProfile, vehicleTypeOptions } from '@/lib/vehicle';
import { ChangePasswordModal } from './_components/ChangePasswordModal';
import ChargingVendorModal from './_components/ChargingVendorModal';
import { PasskeyModal } from './_components/PasskeyModal';
import { TwoFactorModal } from './_components/TwoFactorModal';
import VehicleProfileModal from './_components/VehicleProfileModal';

const UNIT_SYSTEM_OPTIONS = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'Imperial' },
];

const ODOMETER_UNIT_OPTIONS = [
  { value: 'km', label: 'Kilometres (km)' },
  { value: 'miles', label: 'Miles (mi)' },
];

const VOLUME_UNIT_OPTIONS = [
  { value: 'litre', label: 'Litres' },
  { value: 'gallon_us', label: 'Gallons (US)' },
  { value: 'gallon_imp', label: 'Gallons (Imperial)' },
];

const vehicleTypeLabelByValue = new Map(
  vehicleTypeOptions.map((option) => [option.value, option.label]),
);

const getRateUnitLabel = (unit: ChargingVendor['unitRateUnit']) =>
  unit === 'kwh' ? 'kWh' : unit;

const formatChargingVendorRate = (vendor: ChargingVendor) =>
  `${vendor.unitRateMinor}p per ${getRateUnitLabel(vendor.unitRateUnit)}`;

type ParsedUserAgent = {
  browserLabel: string;
  osLabel: string;
  deviceLabel: string;
};

const buildVersionLabel = (
  name?: string | null,
  version?: string | null,
  fallback = 'Unknown',
) => {
  if (!name) {
    return fallback;
  }
  return version ? `${name} ${version}` : name;
};

const parseUserAgentMetadata = (userAgent?: string | null): ParsedUserAgent => {
  if (!userAgent) {
    return {
      browserLabel: 'Unknown browser',
      osLabel: 'Unknown OS',
      deviceLabel: 'Unknown device',
    };
  }
  const parser = new UAParser(userAgent);
  const { name: browserName, version: browserVersion } = parser.getBrowser();
  const { name: osName, version: osVersion } = parser.getOS();
  const device = parser.getDevice();
  const browserLabel = buildVersionLabel(
    browserName,
    browserVersion,
    'Unknown browser',
  );
  const osLabel = buildVersionLabel(osName, osVersion, 'Unknown OS');
  let deviceLabel = 'Unknown device';
  const deviceParts = [device.vendor, device.model].filter(Boolean);
  if (deviceParts.length) {
    deviceLabel = deviceParts.join(' ');
  } else if (device.type) {
    deviceLabel = device.type;
  }
  return { browserLabel, osLabel, deviceLabel };
};

type SessionListItem = {
  id: string;
  token?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
  expiresAt: string | number | Date;
};

const formatSessionTimestamp = (value?: string | number | Date | null) => {
  if (!value) {
    return 'Unknown';
  }
  const sessionDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(sessionDate.getTime())) {
    return 'Unknown';
  }
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(sessionDate);
};

export default function SettingsPage() {
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
  const resolvedOdometerUnit = (() => {
    const odometerUnit = sessionUser?.odometerUnit;
    return odometerUnit === 'miles' ? 'miles' : 'km';
  })();

  const currentSessionIdentifier =
    sessionData?.session?.token ?? sessionData?.session?.id ?? null;

  const [selectedCurrency, setSelectedCurrency] =
    useState<CurrencyCode>(sessionCurrency);
  const [selectedUnitSystem, setSelectedUnitSystem] =
    useState(resolvedUnitSystem);
  const [selectedVolumeUnit, setSelectedVolumeUnit] =
    useState(resolvedVolumeUnit);
  const [selectedOdometerUnit, setSelectedOdometerUnit] =
    useState<OdometerUnit>(resolvedOdometerUnit);
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);
  const [isUpdatingUnitSystem, setIsUpdatingUnitSystem] = useState(false);
  const [isUpdatingVolumeUnit, setIsUpdatingVolumeUnit] = useState(false);
  const [isUpdatingOdometerUnit, setIsUpdatingOdometerUnit] = useState(false);
  const [statusMessage, setStatusMessage] = useState<ToastMessage | null>(null);
  const [isExportingIncome, setIsExportingIncome] = useState(false);
  const [isExportingExpense, setIsExportingExpense] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);
  const [activeSessions, setActiveSessions] = useState<SessionListItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);
  const [revokingSessionTokens, setRevokingSessionTokens] = useState<string[]>(
    [],
  );

  const { data: vehicleProfiles = [], isLoading: isLoadingVehicleProfiles } =
    useVehicleProfiles();
  const createVehicleProfileMutation = useCreateVehicleProfile();
  const updateVehicleProfileMutation = useUpdateVehicleProfile();
  const deleteVehicleProfileMutation = useDeleteVehicleProfile();
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicleProfile, setEditingVehicleProfile] =
    useState<VehicleProfile | null>(null);

  const { data: chargingVendors = [], isLoading: isLoadingChargingVendors } =
    useChargingVendors();
  const createChargingVendorMutation = useCreateChargingVendor();
  const updateChargingVendorMutation = useUpdateChargingVendor();
  const deleteChargingVendorMutation = useDeleteChargingVendor();
  const [isChargingVendorModalOpen, setIsChargingVendorModalOpen] =
    useState(false);
  const [editingChargingVendor, setEditingChargingVendor] =
    useState<ChargingVendor | null>(null);

  const isVehicleProfileSaving =
    createVehicleProfileMutation.isPending ||
    updateVehicleProfileMutation.isPending;
  const isChargingVendorSaving =
    createChargingVendorMutation.isPending ||
    updateChargingVendorMutation.isPending;

  useEffect(() => {
    setSelectedCurrency(sessionCurrency);
    setSelectedUnitSystem(resolvedUnitSystem);
    setSelectedVolumeUnit(resolvedVolumeUnit);
    setSelectedOdometerUnit(resolvedOdometerUnit);
  }, [
    sessionCurrency,
    resolvedUnitSystem,
    resolvedVolumeUnit,
    resolvedOdometerUnit,
  ]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }
    const timer = window.setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    setSessionsError(null);
    try {
      const { data, error } = await authClient.listSessions();
      if (error) {
        setSessionsError(
          error?.message ?? 'Unable to load active sessions right now.',
        );
        setActiveSessions([]);
        return;
      }
      setActiveSessions(Array.isArray(data) ? data : []);
    } catch (caught) {
      setSessionsError(
        caught instanceof Error
          ? caught.message
          : 'Unable to load active sessions right now.',
      );
      setActiveSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const handleRevokeSession = async (sessionToken?: string | null) => {
    if (!sessionToken) {
      return;
    }
    if (revokingSessionTokens.includes(sessionToken)) {
      return;
    }
    setRevokingSessionTokens((previous) => [...previous, sessionToken]);
    setStatusMessage(null);
    try {
      const { data, error } = await authClient.revokeSession({
        token: sessionToken,
      });
      if (error || !data?.status) {
        throw new Error('Unable to revoke session.');
      }
      setStatusMessage({
        type: 'success',
        text: 'Session revoked.',
      });
      await loadSessions();
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Unable to revoke that session right now.',
      });
    } finally {
      setRevokingSessionTokens((previous) =>
        previous.filter((token) => token !== sessionToken),
      );
    }
  };

  const safeCurrentSessionIdentifier =
    currentSessionIdentifier ??
    activeSessions[0]?.token ??
    activeSessions[0]?.id ??
    null;
  const currentSession =
    activeSessions.find((session) => {
      const identifier = session.token ?? session.id;
      return (
        safeCurrentSessionIdentifier !== null &&
        identifier === safeCurrentSessionIdentifier
      );
    }) ??
    activeSessions[0] ??
    null;
  const otherSessions = currentSession
    ? activeSessions.filter((session) => session !== currentSession)
    : activeSessions;
  const currentSessionAgent = currentSession
    ? parseUserAgentMetadata(currentSession.userAgent)
    : null;

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

  const handleOdometerUnitChange = async (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextOdometerUnit = event.target.value as OdometerUnit;
    if (nextOdometerUnit === selectedOdometerUnit) {
      return;
    }
    const previousUnit = selectedOdometerUnit;
    setSelectedOdometerUnit(nextOdometerUnit);
    await updateUserPreference(
      { odometerUnit: nextOdometerUnit },
      previousUnit,
      setSelectedOdometerUnit,
      setIsUpdatingOdometerUnit,
      'Odometer unit saved.',
      'Unable to save odometer unit. Try again shortly.',
    );
  };

  const handleRevokeSessions = async () => {
    if (isRevokingSessions) {
      return;
    }
    setIsRevokingSessions(true);
    setStatusMessage(null);
    try {
      const { data, error } = await authClient.revokeSessions();
      if (error || !data?.status) {
        throw new Error('Unable to revoke sessions.');
      }
      setStatusMessage({
        type: 'success',
        text: 'Signed out of every session.',
      });
      setActiveSessions([]);
      await refetch();
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Unable to sign you out of every session right now.',
      });
    } finally {
      setIsRevokingSessions(false);
    }
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

  const handleOpenChargingVendorModal = (vendor?: ChargingVendor) => {
    setEditingChargingVendor(vendor ?? null);
    setIsChargingVendorModalOpen(true);
  };

  const handleCloseChargingVendorModal = () => {
    setIsChargingVendorModalOpen(false);
    setEditingChargingVendor(null);
  };

  const handleChargingVendorSubmit = (payload: {
    label: string;
    unitRateMinor: number;
    unitRateUnit: UnitRateUnit;
  }) => {
    setStatusMessage(null);
    if (editingChargingVendor) {
      updateChargingVendorMutation.mutate(
        { id: editingChargingVendor.id, ...payload },
        {
          onSuccess: () => {
            handleCloseChargingVendorModal();
            setStatusMessage({
              type: 'success',
              text: 'Charging vendor updated.',
            });
          },
          onError: () =>
            setStatusMessage({
              type: 'error',
              text: 'Unable to save charging vendor. Try again shortly.',
            }),
        },
      );
      return;
    }
    createChargingVendorMutation.mutate(payload, {
      onSuccess: () => {
        handleCloseChargingVendorModal();
        setStatusMessage({
          type: 'success',
          text: 'Charging vendor created.',
        });
      },
      onError: () =>
        setStatusMessage({
          type: 'error',
          text: 'Unable to save charging vendor. Try again shortly.',
        }),
    });
  };

  const handleDeleteChargingVendor = (vendor: ChargingVendor) => {
    const confirmed = window.confirm(
      `Remove ${vendor.label}? Existing expenses aren’t linked to this vendor.`,
    );
    if (!confirmed) {
      return;
    }
    setStatusMessage(null);
    deleteChargingVendorMutation.mutate(
      { id: vendor.id },
      {
        onSuccess: () => {
          setStatusMessage({
            type: 'success',
            text: 'Charging vendor removed.',
          });
        },
        onError: () =>
          setStatusMessage({
            type: 'error',
            text: 'Unable to remove charging vendor right now.',
          }),
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
      <div className='space-y-4 sm:space-y-6'>
        <header className='flex items-center gap-3 sm:gap-4'>
          <div className='flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-accent/20'>
            <i className='fa-solid fa-gear text-lg sm:text-xl text-accent' />
          </div>
          <div>
            <p className='text-xs uppercase text-base-content/60'>
              User Preferences
            </p>
            <h1 className='text-xl sm:text-2xl font-semibold text-base-content'>
              Settings
            </h1>
            <p className='hidden sm:block text-sm text-base-content/60'>
              Keep your login details and preferences tidy.
            </p>
          </div>
        </header>
        <section className='grid gap-4 sm:gap-6 lg:grid-cols-2'>
          <div className='rounded-lg border border-base-content/10 bg-base-100 p-4 sm:p-6 shadow-sm'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-center gap-3'>
                <span className='text-xl text-secondary'>
                  <i className='fa-solid fa-desktop' />
                </span>
                <div>
                  <p className='text-xs uppercase text-base-content/50'>
                    Sessions
                  </p>
                  <p className='hidden sm:block text-sm text-base-content/60'>
                    Devices signed in with this account.
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <span className='badge badge-sm badge-secondary gap-1 whitespace-nowrap'>
                  <i className='fa-solid fa-circle text-[6px]' />
                  {activeSessions.length} active
                </span>
                <button
                  type='button'
                  className='btn btn-sm btn-error btn-outline gap-2 text-xs font-semibold normal-case whitespace-nowrap'
                  onClick={handleRevokeSessions}
                  disabled={isRevokingSessions || activeSessions.length <= 1}
                  title={
                    activeSessions.length <= 1
                      ? 'No other sessions to revoke'
                      : 'Sign out of all other devices'
                  }
                >
                  {isRevokingSessions ? (
                    <span className='loading loading-spinner loading-xs' />
                  ) : (
                    <i className='fa-solid fa-right-from-bracket' />
                  )}
                  <span className='hidden sm:inline'>
                    {isRevokingSessions
                      ? 'Signing out…'
                      : 'Sign out everywhere'}
                  </span>
                  <span className='sm:hidden'>
                    {isRevokingSessions ? '…' : 'Sign out'}
                  </span>
                </button>
              </div>
            </div>
            <div className='mt-6 grid gap-4 md:grid-cols-2'>
              <div>
                <p className='text-xs uppercase text-base-content/50'>Name</p>
                <p className='text-base font-semibold text-base-content'>
                  {sessionUser?.name ?? 'Not set'}
                </p>
              </div>
              <div>
                <p className='text-xs uppercase text-base-content/50'>Email</p>
                <p className='text-base font-semibold text-base-content'>
                  {sessionUser?.email ?? '—'}
                </p>
              </div>
            </div>
            <div className='mt-6 space-y-4'>
              {isLoadingSessions ? (
                <div className='flex items-center gap-2 text-sm text-base-content/60'>
                  <span className='loading loading-spinner loading-sm' />
                  Loading sessions…
                </div>
              ) : activeSessions.length === 0 ? (
                <div className='flex flex-col items-center gap-2 rounded-lg border border-base-content/10 px-4 py-8 text-center'>
                  <i className='fa-solid fa-desktop text-2xl text-base-content/30' />
                  <p className='text-sm text-base-content/60'>
                    No active sessions found.
                  </p>
                  <p className='text-xs text-base-content/50'>
                    Sign in again to refresh this list.
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {currentSession ? (
                    <div
                      className='rounded-lg border border-base-content/10 border-l-4 border-l-success bg-base-200 p-4 shadow-sm'
                      key={currentSession.token ?? currentSession.id}
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='flex items-start gap-3'>
                          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-success/20'>
                            <i className='fa-solid fa-check text-success' />
                          </div>
                          <div>
                            <p className='text-sm font-semibold text-base-content'>
                              {currentSessionAgent?.browserLabel ??
                                'Unknown browser'}
                            </p>
                            <p className='text-xs text-base-content/60'>
                              {currentSessionAgent?.osLabel ?? 'Unknown OS'} ·{' '}
                              {currentSessionAgent?.deviceLabel ??
                                'Unknown device'}
                            </p>
                            <p className='text-xs text-base-content/50 mt-1'>
                              <i className='fa-solid fa-location-dot mr-1' />
                              {currentSession.ipAddress ?? 'Unknown IP'}
                            </p>
                          </div>
                        </div>
                        <span className='badge badge-xs sm:badge-sm badge-success gap-1 whitespace-nowrap'>
                          <i className='fa-solid fa-circle-check text-xs' />
                          This device
                        </span>
                      </div>
                      <div className='mt-4 flex flex-wrap gap-4 text-xs text-base-content/60 border-t border-base-content/10 pt-3'>
                        <div className='flex items-center gap-1'>
                          <i className='fa-regular fa-calendar-plus text-base-content/40' />
                          Created{' '}
                          {formatSessionTimestamp(currentSession.createdAt)}
                        </div>
                        <div className='flex items-center gap-1'>
                          <i className='fa-regular fa-clock text-base-content/40' />
                          Updated{' '}
                          {formatSessionTimestamp(currentSession.updatedAt)}
                        </div>
                        <div className='flex items-center gap-1'>
                          <i className='fa-regular fa-hourglass-half text-base-content/40' />
                          Expires{' '}
                          {formatSessionTimestamp(currentSession.expiresAt)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='rounded-lg border border-base-content/10 bg-base-200 p-4 text-sm text-base-content/60 shadow-sm'>
                      <i className='fa-solid fa-circle-question mr-2 text-warning' />
                      Unable to determine the current session.
                    </div>
                  )}
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <p className='text-xs uppercase text-base-content/50'>
                        <i className='fa-solid fa-laptop mr-1' />
                        Other devices
                      </p>
                      {otherSessions.length > 0 && (
                        <span className='badge badge-ghost badge-sm'>
                          {otherSessions.length} session
                          {otherSessions.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {otherSessions.length === 0 ? (
                      <div className='flex items-center gap-2 rounded-lg border border-dashed border-base-content/20 px-4 py-3 text-sm text-base-content/50'>
                        <i className='fa-regular fa-circle-check' />
                        No additional active sessions.
                      </div>
                    ) : (
                      <div className='space-y-2'>
                        {otherSessions.map((sessionInfo) => {
                          const identifier =
                            sessionInfo.token ?? sessionInfo.id;
                          const parsedAgent = parseUserAgentMetadata(
                            sessionInfo.userAgent,
                          );
                          const isRevoking = revokingSessionTokens.includes(
                            sessionInfo.token ?? '',
                          );
                          return (
                            <div
                              key={identifier}
                              className='collapse collapse-arrow rounded-lg border border-base-content/10 border-l-4 border-l-secondary bg-base-200'
                            >
                              <input type='checkbox' />
                              <div className='collapse-title flex items-center gap-3'>
                                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20'>
                                  <i className='fa-solid fa-globe text-sm text-secondary' />
                                </div>
                                <div className='flex-1'>
                                  <p className='text-sm font-semibold text-base-content'>
                                    {parsedAgent.browserLabel}
                                  </p>
                                  <p className='text-xs text-base-content/60'>
                                    {parsedAgent.osLabel} ·{' '}
                                    {parsedAgent.deviceLabel}
                                  </p>
                                </div>
                              </div>
                              <div className='collapse-content space-y-4 border-t border-base-content/10 pt-4 text-xs text-base-content/60'>
                                <div className='flex flex-wrap gap-4'>
                                  <div className='flex items-center gap-1'>
                                    <i className='fa-regular fa-calendar-plus text-base-content/40' />
                                    Created{' '}
                                    {formatSessionTimestamp(
                                      sessionInfo.createdAt,
                                    )}
                                  </div>
                                  <div className='flex items-center gap-1'>
                                    <i className='fa-regular fa-clock text-base-content/40' />
                                    Updated{' '}
                                    {formatSessionTimestamp(
                                      sessionInfo.updatedAt,
                                    )}
                                  </div>
                                  <div className='flex items-center gap-1'>
                                    <i className='fa-regular fa-hourglass-half text-base-content/40' />
                                    Expires{' '}
                                    {formatSessionTimestamp(
                                      sessionInfo.expiresAt,
                                    )}
                                  </div>
                                  <div className='flex items-center gap-1'>
                                    <i className='fa-solid fa-location-dot text-base-content/40' />
                                    {sessionInfo.ipAddress ?? 'Unknown IP'}
                                  </div>
                                </div>
                                {sessionInfo.token && (
                                  <div className='flex justify-end'>
                                    <button
                                      type='button'
                                      className='btn btn-sm btn-error btn-outline gap-1 text-xs normal-case'
                                      onClick={() =>
                                        handleRevokeSession(sessionInfo.token)
                                      }
                                      disabled={isRevoking}
                                    >
                                      {isRevoking ? (
                                        <span className='loading loading-spinner loading-xs' />
                                      ) : (
                                        <i className='fa-solid fa-right-from-bracket' />
                                      )}
                                      {isRevoking ? 'Revoking…' : 'Revoke'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {sessionsError && (
                <p className='text-xs text-error'>{sessionsError}</p>
              )}
            </div>
          </div>
          <div className='rounded-lg border border-base-content/10 bg-base-100 p-4 sm:p-6 shadow-sm'>
            <div className='flex items-center justify-between gap-4'>
              <div className='flex items-center gap-3'>
                <span className='text-xl text-warning'>
                  <i className='fa-solid fa-shield-halved' />
                </span>
                <div>
                  <p className='text-xs uppercase text-base-content/50'>
                    Security
                  </p>
                  <p className='hidden sm:block text-sm text-base-content/60'>
                    Keep your authentication choices up to date.
                  </p>
                </div>
              </div>
              <span
                className={`badge badge-sm whitespace-nowrap ${
                  isTwoFactorEnabled ? 'badge-success' : 'badge-warning'
                } gap-1`}
              >
                <i
                  className={`fa-solid ${
                    isTwoFactorEnabled ? 'fa-check' : 'fa-exclamation'
                  } text-xs`}
                />
                {isTwoFactorEnabled ? '2FA enabled' : '2FA disabled'}
              </span>
            </div>
            <div className='mt-6 space-y-3'>
              <div className='rounded-lg border border-base-content/10 border-l-4 border-l-success bg-base-200 px-4 py-4'>
                <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-9 w-9 items-center justify-center rounded-full bg-success/20'>
                      <i className='fa-solid fa-mobile-screen text-success' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-base-content'>
                        Two-factor authentication
                      </p>
                      <p className='text-xs text-base-content/60'>
                        Protect access with an extra verification step.
                      </p>
                    </div>
                  </div>
                  <button
                    type='button'
                    className='btn btn-success gap-2 text-sm font-semibold'
                    onClick={openTwoFactorModal}
                  >
                    <i className='fa-solid fa-shield-halved' />
                    Manage two-factor
                  </button>
                </div>
              </div>
              <div className='rounded-lg border border-base-content/10 border-l-4 border-l-warning bg-base-200 px-4 py-4'>
                <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-9 w-9 items-center justify-center rounded-full bg-warning/20'>
                      <i className='fa-solid fa-key text-warning' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-base-content'>
                        Password
                      </p>
                      <p className='text-xs text-base-content/60'>
                        Rotate your password for extra assurance.
                      </p>
                    </div>
                  </div>
                  <button
                    type='button'
                    className='btn btn-warning gap-2 text-sm font-semibold'
                    onClick={openPasswordModal}
                  >
                    <i className='fa-solid fa-lock' />
                    Change password
                  </button>
                </div>
              </div>
              <div className='rounded-lg border border-base-content/10 border-l-4 border-l-primary bg-base-200 px-4 py-4'>
                <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/20'>
                      <i className='fa-solid fa-fingerprint text-primary' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-base-content'>
                        Passkeys
                      </p>
                      <p className='text-xs text-base-content/60'>
                        Sign in faster with biometrics or security keys.
                      </p>
                    </div>
                  </div>
                  <button
                    type='button'
                    className='btn btn-primary gap-2 text-sm font-semibold'
                    onClick={() => setIsPasskeyModalOpen(true)}
                  >
                    <i className='fa-solid fa-fingerprint' />
                    Manage passkeys
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className='rounded-lg border border-base-content/10 bg-base-100 p-4 sm:p-6 shadow-sm'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-3'>
              <span className='text-xl text-accent'>
                <i className='fa-solid fa-sliders' />
              </span>
              <div>
                <p className='text-xs uppercase text-base-content/50'>
                  Workspace settings
                </p>
                <p className='hidden sm:block text-sm text-base-content/60'>
                  Customize currency, volume units, and the workspace
                  experience.
                </p>
              </div>
            </div>
          </div>
          <div className='mt-6 space-y-3'>
            <div className='rounded-lg border border-base-content/10 border-l-4 border-l-accent bg-base-200 px-4 py-4'>
              <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-9 w-9 items-center justify-center rounded-full bg-accent/20'>
                    <i className='fa-solid fa-sterling-sign text-accent' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-base-content'>
                      Default currency
                    </p>
                    <p className='text-xs text-base-content/60'>
                      Controls how values appear in your workspace.
                    </p>
                  </div>
                </div>
                <div className='w-full max-w-xs'>
                  <label className='sr-only' htmlFor='default-currency'>
                    Default currency
                  </label>
                  <select
                    id='default-currency'
                    className='select select-bordered w-full'
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
            <div className='rounded-lg border border-base-content/10 border-l-4 border-l-accent bg-base-200 px-4 py-4'>
              <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-9 w-9 items-center justify-center rounded-full bg-accent/20'>
                    <i className='fa-solid fa-ruler text-accent' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-base-content'>
                      Unit system
                    </p>
                    <p className='text-xs text-base-content/60'>
                      Choose Metric for litres or Imperial for gallons.
                    </p>
                  </div>
                </div>
                <div className='w-full max-w-xs'>
                  <label className='sr-only' htmlFor='unit-system'>
                    Unit system
                  </label>
                  <select
                    id='unit-system'
                    className='select select-bordered w-full'
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
            </div>
            <div className='rounded-lg border border-base-content/10 border-l-4 border-l-accent bg-base-200 px-4 py-4'>
              <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-9 w-9 items-center justify-center rounded-full bg-accent/20'>
                    <i className='fa-solid fa-gauge text-accent' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-base-content'>
                      Odometer units
                    </p>
                    <p className='text-xs text-base-content/60'>
                      Display readings in kilometres or miles.
                    </p>
                  </div>
                </div>
                <div className='w-full max-w-xs'>
                  <label className='sr-only' htmlFor='odometer-units'>
                    Odometer units
                  </label>
                  <select
                    id='odometer-units'
                    className='select select-bordered w-full'
                    value={selectedOdometerUnit}
                    onChange={handleOdometerUnitChange}
                    disabled={isUpdatingOdometerUnit}
                  >
                    {ODOMETER_UNIT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className='rounded-lg border border-base-content/10 border-l-4 border-l-accent bg-base-200 px-4 py-4'>
              <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-9 w-9 items-center justify-center rounded-full bg-accent/20'>
                    <i className='fa-solid fa-droplet text-accent' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-base-content'>
                      Volume unit
                    </p>
                    <p className='text-xs text-base-content/60'>
                      Select litres or the gallon type you prefer.
                    </p>
                  </div>
                </div>
                <div className='w-full max-w-xs'>
                  <label className='sr-only' htmlFor='volume-unit'>
                    Volume unit
                  </label>
                  <select
                    id='volume-unit'
                    className='select select-bordered w-full'
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
          </div>
        </section>

        <section className='rounded-lg border border-base-content/10 bg-base-100 p-4 sm:p-6 shadow-sm'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <span className='text-xl text-primary'>
                <i className='fa-solid fa-car' />
              </span>
              <div>
                <p className='text-xs uppercase text-base-content/50'>
                  Vehicle profiles
                </p>
                <p className='hidden sm:block text-sm text-base-content/60'>
                  Manage vehicles that drive your expense tracking.
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {vehicleProfiles.length > 0 && (
                <span className='badge badge-sm badge-primary gap-1'>
                  <i className='fa-solid fa-car text-[8px]' />
                  {vehicleProfiles.length}
                </span>
              )}
              <button
                type='button'
                className='btn btn-sm btn-square sm:btn-md btn-primary sm:gap-2 text-sm font-semibold'
                onClick={() => handleOpenVehicleModal()}
              >
                <i className='fa-solid fa-plus' />
              </button>
            </div>
          </div>
          <div className='mt-6 space-y-3'>
            {isLoadingVehicleProfiles ? (
              <div className='flex items-center gap-2 text-sm text-base-content/60'>
                <span className='loading loading-spinner loading-sm' />
                Loading vehicle profiles…
              </div>
            ) : vehicleProfiles.length === 0 ? (
              <div className='flex flex-col items-center gap-2 rounded-lg border border-dashed border-base-content/20 px-4 py-8 text-center'>
                <i className='fa-solid fa-car text-2xl text-base-content/30' />
                <p className='text-sm text-base-content/60'>
                  No vehicle profiles yet.
                </p>
                <button
                  type='button'
                  className='btn btn-sm btn-primary btn-outline gap-1 text-xs normal-case'
                  onClick={() => handleOpenVehicleModal()}
                >
                  <i className='fa-solid fa-plus text-[10px]' />
                  Create your first profile
                </button>
              </div>
            ) : (
              <div className='space-y-3'>
                {vehicleProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className='rounded-lg border border-base-content/10 border-l-4 border-l-primary bg-base-200 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-base-200/80'
                  >
                    <div className='flex items-center justify-between gap-4'>
                      <div className='flex items-center gap-3 min-w-0'>
                        <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20'>
                          <i className='fa-solid fa-car text-primary' />
                        </div>
                        <div className='min-w-0'>
                          <p className='text-sm font-semibold text-base-content truncate'>
                            {profile.label}
                          </p>
                          <p className='text-xs text-base-content/60'>
                            {vehicleTypeLabelByValue.get(profile.vehicleType) ??
                              profile.vehicleType}
                          </p>
                        </div>
                      </div>
                      <div className='flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3'>
                        {profile.isDefault && (
                          <span className='badge badge-sm badge-primary gap-1 whitespace-nowrap'>
                            <i className='fa-solid fa-star text-xs' />
                            Default
                          </span>
                        )}
                        <div className='flex shrink-0 gap-1'>
                          <button
                            type='button'
                            className='btn btn-xs btn-square btn-ghost text-info'
                            disabled={isVehicleProfileSaving}
                            onClick={() => handleOpenVehicleModal(profile)}
                            title='Edit'
                          >
                            <i className='fa-solid fa-pen text-xs' />
                          </button>
                          {!profile.isDefault && (
                            <button
                              type='button'
                              className='btn btn-xs text-primary btn-square btn-ghost'
                              onClick={() =>
                                handleSetDefaultVehicleProfile(profile)
                              }
                              disabled={updateVehicleProfileMutation.isPending}
                              title='Set as default'
                            >
                              <i className='fa-solid fa-star text-xs' />
                            </button>
                          )}
                          <button
                            type='button'
                            className='btn btn-xs btn-square btn-ghost text-error'
                            onClick={() => handleDeleteVehicleProfile(profile)}
                            disabled={deleteVehicleProfileMutation.isPending}
                            title='Delete'
                          >
                            <i className='fa-solid fa-trash text-xs' />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className='rounded-lg border border-base-content/10 bg-base-100 p-4 sm:p-6 shadow-sm'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <span className='text-xl text-info'>
                <i className='fa-solid fa-bolt' />
              </span>
              <div>
                <p className='text-xs uppercase text-base-content/50'>
                  EV charging vendors
                </p>
                <p className='hidden sm:block text-sm text-base-content/60'>
                  Store vendor names and default rates for quick logging.
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {chargingVendors.length > 0 && (
                <span className='badge badge-sm badge-info gap-1'>
                  <i className='fa-solid fa-bolt text-[8px]' />
                  {chargingVendors.length}
                </span>
              )}
              <button
                type='button'
                className='btn btn-sm btn-square sm:btn-md btn-info sm:gap-2 text-sm font-semibold'
                onClick={() => handleOpenChargingVendorModal()}
                disabled={isChargingVendorSaving}
              >
                <i className='fa-solid fa-plus' />
              </button>
            </div>
          </div>
          <div className='mt-6 space-y-3'>
            {isLoadingChargingVendors ? (
              <div className='flex items-center gap-2 text-sm text-base-content/60'>
                <span className='loading loading-spinner loading-sm' />
                Loading charging vendors…
              </div>
            ) : chargingVendors.length === 0 ? (
              <div className='flex flex-col items-center gap-2 rounded-lg border border-dashed border-base-content/20 px-4 py-8 text-center'>
                <i className='fa-solid fa-bolt text-2xl text-base-content/30' />
                <p className='text-sm text-base-content/60'>
                  No charging vendors yet.
                </p>
                <button
                  type='button'
                  className='btn btn-sm btn-info btn-outline gap-1 text-xs normal-case'
                  onClick={() => handleOpenChargingVendorModal()}
                >
                  <i className='fa-solid fa-plus text-[10px]' />
                  Create vendor
                </button>
              </div>
            ) : (
              <div className='space-y-3'>
                {chargingVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className='rounded-lg border border-base-content/10 border-l-4 border-l-info bg-base-200 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-base-200/80'
                  >
                    <div className='flex items-center justify-between gap-4'>
                      <div className='flex items-center gap-3 min-w-0'>
                        <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info/20'>
                          <i className='fa-solid fa-bolt text-info' />
                        </div>
                        <div className='min-w-0'>
                          <p className='text-sm font-semibold text-base-content truncate'>
                            {vendor.label}
                          </p>
                          <p className='text-xs text-base-content/60'>
                            {formatChargingVendorRate(vendor)}
                          </p>
                        </div>
                      </div>
                      <div className='flex shrink-0 gap-1'>
                        <button
                          type='button'
                          className='btn btn-xs btn-square btn-ghost text-info'
                          disabled={isChargingVendorSaving}
                          onClick={() => handleOpenChargingVendorModal(vendor)}
                          title='Edit'
                        >
                          <i className='fa-solid fa-pen text-xs' />
                        </button>
                        <button
                          type='button'
                          className='btn btn-xs btn-square btn-ghost text-error'
                          disabled={deleteChargingVendorMutation.isPending}
                          onClick={() => handleDeleteChargingVendor(vendor)}
                          title='Delete'
                        >
                          <i className='fa-solid fa-trash text-xs' />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className='rounded-lg border border-base-content/10 bg-base-100 p-4 sm:p-6 shadow-sm'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-3'>
              <span className='text-xl text-secondary'>
                <i className='fa-solid fa-download' />
              </span>
              <div>
                <p className='text-xs uppercase text-base-content/50'>
                  Export data
                </p>
                <p className='hidden sm:block text-sm text-base-content/60'>
                  Download copies of your history for backup or review.
                </p>
              </div>
            </div>
          </div>
          <div className='mt-6 space-y-3'>
            <div className='rounded-lg border border-base-content/10 border-l-4 border-l-success bg-base-200 px-4 py-4'>
              <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-9 w-9 items-center justify-center rounded-full bg-success/20'>
                    <i className='fa-solid fa-coins text-success' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-base-content'>
                      Income logs
                    </p>
                    <p className='text-xs text-base-content/60'>
                      Export every logged income entry as a CSV file.
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  className='btn btn-success gap-2 text-sm font-semibold'
                  onClick={handleExportIncomeCsv}
                  disabled={isExportingIncome}
                >
                  {isExportingIncome ? (
                    <span className='loading loading-spinner loading-sm' />
                  ) : (
                    <i className='fa-solid fa-file-csv' />
                  )}
                  {isExportingIncome ? 'Preparing…' : 'Export income'}
                </button>
              </div>
            </div>
            <div className='rounded-lg border border-base-content/10 border-l-4 border-l-error bg-base-200 px-4 py-4'>
              <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-9 w-9 items-center justify-center rounded-full bg-error/20'>
                    <i className='fa-solid fa-receipt text-error' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-base-content'>
                      Expense logs
                    </p>
                    <p className='text-xs text-base-content/60'>
                      Export every logged expense entry as a CSV file.
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  className='btn btn-error gap-2 text-sm font-semibold'
                  onClick={handleExportExpenseCsv}
                  disabled={isExportingExpense}
                >
                  {isExportingExpense ? (
                    <span className='loading loading-spinner loading-sm' />
                  ) : (
                    <i className='fa-solid fa-file-csv' />
                  )}
                  {isExportingExpense ? 'Preparing…' : 'Export expenses'}
                </button>
              </div>
            </div>
            <div className='rounded-lg border border-base-content/10 border-l-4 border-l-primary bg-base-200 px-4 py-4'>
              <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/20'>
                    <i className='fa-solid fa-database text-primary' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-base-content'>
                      All data
                    </p>
                    <p className='text-xs text-base-content/60'>
                      Download every entry in one combined CSV.
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  className='btn btn-primary gap-2 text-sm font-semibold'
                  onClick={handleExportAllDataCsv}
                  disabled={isExportingAll}
                >
                  {isExportingAll ? (
                    <span className='loading loading-spinner loading-sm' />
                  ) : (
                    <i className='fa-solid fa-download' />
                  )}
                  {isExportingAll ? 'Preparing…' : 'Export all'}
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

        {isPasskeyModalOpen && (
          <PasskeyModal onClose={() => setIsPasskeyModalOpen(false)} />
        )}

        <VehicleProfileModal
          isOpen={isVehicleModalOpen}
          profile={editingVehicleProfile}
          isSubmitting={isVehicleProfileSaving}
          onClose={handleCloseVehicleModal}
          onSubmit={handleVehicleProfileSubmit}
        />
        <ChargingVendorModal
          isOpen={isChargingVendorModalOpen}
          vendor={editingChargingVendor}
          isSubmitting={isChargingVendorSaving}
          onClose={handleCloseChargingVendorModal}
          onSubmit={handleChargingVendorSubmit}
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
