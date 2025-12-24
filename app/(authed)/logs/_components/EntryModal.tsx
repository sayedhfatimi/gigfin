'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import type { ChargingVendor } from '@/lib/charging-vendor';
import type { CurrencyCode } from '@/lib/currency';
import { getCurrencyIcon } from '@/lib/currency';
import type { ExpenseEntry, UnitRateUnit } from '@/lib/expenses';
import { expenseTypeOptions } from '@/lib/expenses';
import type { IncomeEntry } from '@/lib/income';
import type { OdometerEntry } from '@/lib/odometer';
import type { ExpensePayload } from '@/lib/queries/expenses';
import type { OdometerPayload } from '@/lib/queries/odometers';
import type { VehicleProfile } from '@/lib/vehicle';

const incomeSources = [
  'Uber Eats',
  'Deliveroo',
  'Just Eat',
  'Amazon Flex',
  'Lyft',
  'DoorDash',
  'Other',
];

const getTodayIso = () => new Date().toISOString().split('T')[0];

const expenseModeOptions = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'charging', label: 'Charging' },
] as const;

const getVendorRateLabel = (vendor: ChargingVendor) =>
  `${vendor.unitRateMinor}p per ${
    vendor.unitRateUnit === 'kwh' ? 'kWh' : vendor.unitRateUnit
  }`;

type EntryTab = 'income' | 'expense' | 'odometer';

type EntryModalProps = {
  isOpen: boolean;
  activeTab: EntryTab;
  onTabChange: (value: EntryTab) => void;
  currency: CurrencyCode;
  vehicleProfiles: VehicleProfile[];
  volumeUnit: UnitRateUnit;
  editingIncome: IncomeEntry | null;
  editingExpense: ExpenseEntry | null;
  editingOdometer: OdometerEntry | null;
  chargingVendors: ChargingVendor[];
  onSubmitIncome: (payload: {
    id?: string;
    date: string;
    platform: string;
    amount: number;
  }) => Promise<void>;
  onSubmitExpense: (payload: ExpensePayload & { id?: string }) => Promise<void>;
  onSubmitOdometer: (
    payload: OdometerPayload & { id?: string },
  ) => Promise<void>;
  isSubmittingIncome: boolean;
  isSubmittingExpense: boolean;
  isSubmittingOdometer: boolean;
  onClose: () => void;
};

const EntryModal = ({
  isOpen,
  activeTab,
  onTabChange,
  currency,
  vehicleProfiles,
  volumeUnit,
  editingIncome,
  editingExpense,
  editingOdometer,
  chargingVendors,
  onSubmitIncome,
  onSubmitExpense,
  onSubmitOdometer,
  isSubmittingIncome,
  isSubmittingExpense,
  isSubmittingOdometer,
  onClose,
}: EntryModalProps) => {
  const isEditingIncome = Boolean(editingIncome);
  const isEditingExpense = Boolean(editingExpense);
  const isEditingOdometer = Boolean(editingOdometer);
  const [incomeDate, setIncomeDate] = useState(getTodayIso());
  const [incomePlatform, setIncomePlatform] = useState(incomeSources[0]);
  const [incomeAmount, setIncomeAmount] = useState('');

  const [expenseDate, setExpenseDate] = useState(getTodayIso());
  const [expenseType, setExpenseType] = useState(expenseTypeOptions[0].value);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [vehicleProfileId, setVehicleProfileId] = useState('');
  const [expenseRate, setExpenseRate] = useState('');
  const [expenseMode, setExpenseMode] = useState<'fuel' | 'charging'>('fuel');
  const [formError, setFormError] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [vendorNotesPrefill, setVendorNotesPrefill] = useState('');

  const [odometerDate, setOdometerDate] = useState(getTodayIso());
  const [odometerStartReading, setOdometerStartReading] = useState('');
  const [odometerEndReading, setOdometerEndReading] = useState('');
  const [odometerVehicleProfileId, setOdometerVehicleProfileId] = useState('');

  const defaultVehicleProfileId = useMemo(
    () => vehicleProfiles.find((profile) => profile.isDefault)?.id ?? '',
    [vehicleProfiles],
  );

  const selectedVehicle = useMemo(
    () => vehicleProfiles.find((profile) => profile.id === vehicleProfileId),
    [vehicleProfileId, vehicleProfiles],
  );

  useEffect(() => {
    if (!isOpen) {
      setFormError('');
      return;
    }
    if (editingIncome) {
      setIncomeDate(editingIncome.date);
      setIncomePlatform(editingIncome.platform);
      setIncomeAmount(editingIncome.amount.toString());
    } else {
      setIncomeDate(getTodayIso());
      setIncomePlatform(incomeSources[0]);
      setIncomeAmount('');
    }
  }, [editingIncome, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (editingExpense) {
      setExpenseDate(editingExpense.paidAt);
      setExpenseType(editingExpense.expenseType);
      setExpenseAmount((editingExpense.amountMinor / 100).toFixed(2));
      setExpenseNotes(editingExpense.notes ?? '');
      setVehicleProfileId(editingExpense.vehicleProfileId ?? '');
      setExpenseRate(editingExpense.unitRateMinor?.toString() ?? '');
      if (editingExpense.unitRateUnit === 'kwh') {
        setExpenseMode('charging');
      } else {
        setExpenseMode('fuel');
      }
      setSelectedVendorId('');
      setVendorNotesPrefill('');
    } else {
      setExpenseDate(getTodayIso());
      setExpenseType(expenseTypeOptions[0].value);
      setExpenseAmount('');
      setExpenseNotes('');
      setVehicleProfileId(defaultVehicleProfileId);
      setExpenseRate('');
      setExpenseMode('fuel');
      setSelectedVendorId('');
      setVendorNotesPrefill('');
    }
  }, [editingExpense, isOpen, defaultVehicleProfileId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (editingOdometer) {
      setOdometerDate(editingOdometer.date);
      setOdometerStartReading(editingOdometer.startReading.toString());
      setOdometerEndReading(editingOdometer.endReading.toString());
      setOdometerVehicleProfileId(editingOdometer.vehicleProfileId ?? '');
    } else {
      setOdometerDate(getTodayIso());
      setOdometerStartReading('');
      setOdometerEndReading('');
      setOdometerVehicleProfileId(defaultVehicleProfileId);
    }
  }, [editingOdometer, isOpen, defaultVehicleProfileId]);

  useEffect(() => {
    if (!selectedVehicle) {
      return;
    }
    if (selectedVehicle.vehicleType === 'EV') {
      setExpenseMode('charging');
    } else if (
      selectedVehicle.vehicleType === 'PETROL' ||
      selectedVehicle.vehicleType === 'DIESEL'
    ) {
      setExpenseMode('fuel');
    }
  }, [selectedVehicle]);

  const isFuelExpense = expenseType === 'fuel_charging';
  const isRateBasedExpense = isFuelExpense;

  const effectiveMode =
    selectedVehicle?.vehicleType === 'EV' ? 'charging' : expenseMode;

  const rateUnit: UnitRateUnit | null = (() => {
    if (!isFuelExpense || !selectedVehicle) {
      return null;
    }
    if (selectedVehicle.vehicleType === 'EV') {
      return 'kwh';
    }
    if (selectedVehicle.vehicleType === 'HYBRID') {
      return effectiveMode === 'charging' ? 'kwh' : volumeUnit;
    }
    return volumeUnit;
  })();

  useEffect(() => {
    if (isFuelExpense && rateUnit === 'kwh') {
      return;
    }
    if (selectedVendorId) {
      setSelectedVendorId('');
    }
    setVendorNotesPrefill('');
  }, [isFuelExpense, rateUnit, selectedVendorId]);

  useEffect(() => {
    if (!isFuelExpense || rateUnit !== 'kwh' || !selectedVendorId) {
      return;
    }
    const vendor = chargingVendors.find((item) => item.id === selectedVendorId);
    if (!vendor) {
      return;
    }
    const rateString = vendor.unitRateMinor.toString();
    if (expenseRate !== rateString) {
      setExpenseRate(rateString);
    }
    if (!expenseNotes || expenseNotes === vendorNotesPrefill) {
      setExpenseNotes(vendor.label);
      setVendorNotesPrefill(vendor.label);
    }
  }, [
    selectedVendorId,
    chargingVendors,
    isFuelExpense,
    rateUnit,
    expenseRate,
    expenseNotes,
    vendorNotesPrefill,
  ]);

  const rateLabel =
    rateUnit === 'kwh'
      ? 'kWh'
      : rateUnit === 'litre'
        ? 'litre'
        : rateUnit === 'gallon_us'
          ? 'gallon (US)'
          : rateUnit === 'gallon_imp'
            ? 'gallon (Imperial)'
            : 'unit';

  const resetModal = () => {
    setFormError('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleIncomeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountValue = Number.parseFloat(incomeAmount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setFormError('Enter a valid amount greater than zero.');
      return;
    }
    if (!incomePlatform.trim()) {
      setFormError('Choose a platform or describe the income source.');
      return;
    }
    setFormError('');
    try {
      await onSubmitIncome({
        id: editingIncome?.id,
        date: incomeDate,
        platform: incomePlatform,
        amount: amountValue,
      });
      handleClose();
    } catch {
      setFormError('Unable to save income entry. Try again shortly.');
    }
  };

  const handleExpenseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountValue = Number.parseFloat(expenseAmount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setFormError('Enter a valid amount greater than zero.');
      return;
    }
    if (isFuelExpense && !vehicleProfileId) {
      setFormError('Select a vehicle profile for fuel or charging costs.');
      return;
    }
    let unitRateMinor: number | null = null;
    if (isRateBasedExpense) {
      const rateValue = Number.parseFloat(expenseRate);
      if (Number.isNaN(rateValue) || rateValue <= 0) {
        setFormError('Enter the unit rate in pence for fuel or charging.');
        return;
      }
      unitRateMinor = Math.round(rateValue);
    }
    const payload: ExpensePayload & { id?: string } = {
      id: editingExpense?.id,
      expenseType,
      amountMinor: Math.round(amountValue * 100),
      paidAt: expenseDate,
      notes: expenseNotes.trim() || null,
      vehicleProfileId: vehicleProfileId || null,
      unitRateMinor,
      unitRateUnit: unitRateMinor ? rateUnit : null,
      detailsJson: null,
    };
    setFormError('');
    try {
      await onSubmitExpense(payload);
      handleClose();
    } catch {
      setFormError('Unable to save expense entry. Try again shortly.');
    }
  };

  const handleOdometerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const startValue = Number.parseFloat(odometerStartReading);
    const endValue = Number.parseFloat(odometerEndReading);
    if (
      Number.isNaN(startValue) ||
      Number.isNaN(endValue) ||
      startValue < 0 ||
      endValue < 0
    ) {
      setFormError('Enter valid start and end odometer readings.');
      return;
    }
    if (endValue < startValue) {
      setFormError(
        'End reading must be equal to or greater than the start reading.',
      );
      return;
    }
    const payload: OdometerPayload & { id?: string } = {
      id: editingOdometer?.id,
      date: odometerDate,
      startReading: startValue,
      endReading: endValue,
      vehicleProfileId: odometerVehicleProfileId || null,
    };
    setFormError('');
    try {
      await onSubmitOdometer(payload);
      handleClose();
    } catch {
      setFormError('Unable to save odometer entry. Try again shortly.');
    }
  };

  const title =
    activeTab === 'income'
      ? editingIncome
        ? 'Update income entry'
        : 'Log new income'
      : activeTab === 'expense'
        ? editingExpense
          ? 'Update expense entry'
          : 'Log new expense'
        : editingOdometer
          ? 'Update odometer entry'
          : 'Log new odometer reading';

  const isEditingAny = isEditingIncome || isEditingExpense || isEditingOdometer;

  if (!isOpen) {
    return null;
  }

  return (
    <div className='modal modal-open'>
      <div className='modal-box'>
        <div className='flex flex-row justify-between items-center gap-2'>
          <h3 className='text-lg font-semibold text-base-content'>{title}</h3>

          <div role='tablist' className='tabs tabs-box'>
            {(['income', 'expense', 'odometer'] as EntryTab[]).map((tab) => {
              const isTabDisabled = isEditingAny && activeTab !== tab;
              return (
                <input
                  key={tab}
                  type='radio'
                  name='entry-modal-tabs'
                  className='tab'
                  aria-label={
                    tab === 'income'
                      ? 'Income'
                      : tab === 'expense'
                        ? 'Expense'
                        : 'Odometer'
                  }
                  checked={activeTab === tab}
                  onChange={() => onTabChange(tab)}
                  disabled={isTabDisabled}
                />
              );
            })}
          </div>
        </div>
        {activeTab === 'income' ? (
          <form className='mt-4 space-y-4' onSubmit={handleIncomeSubmit}>
            <label className='input w-full'>
              <span className='label text-xs uppercase text-base-content/50'>
                Date
              </span>
              <input
                type='date'
                value={incomeDate}
                onChange={(event) => setIncomeDate(event.target.value)}
                required
              />
            </label>
            <label className='select w-full'>
              <span className='label text-xs uppercase text-base-content/50'>
                Platform
              </span>
              <select
                value={incomePlatform}
                onChange={(event) => setIncomePlatform(event.target.value)}
              >
                {incomeSources.map((source) => (
                  <option key={source}>{source}</option>
                ))}
              </select>
            </label>
            <div className='flex flex-col gap-2'>
              <label className='input validator w-full'>
                <span className='label text-xs uppercase text-base-content/50'>
                  Amount Earned{' '}
                  <i
                    className={`fa-solid ${getCurrencyIcon(
                      currency,
                    )} text-base-content/60`}
                  />
                </span>
                <input
                  type='number'
                  step='0.01'
                  min='0'
                  placeholder='e.g. 45.50'
                  id='entry-income-amount'
                  value={incomeAmount}
                  onChange={(event) => setIncomeAmount(event.target.value)}
                  required
                />
              </label>
            </div>
            {formError && <p className='text-sm text-error'>{formError}</p>}
            <div className='modal-action'>
              <button
                type='button'
                className='btn btn-ghost'
                onClick={handleClose}
                disabled={isSubmittingIncome}
              >
                Cancel
              </button>
              <button
                type='submit'
                className={`btn btn-primary ${
                  isSubmittingIncome ? 'loading' : ''
                }`}
                disabled={isSubmittingIncome}
              >
                {editingIncome ? 'Save changes' : 'Add income'}
              </button>
            </div>
          </form>
        ) : activeTab === 'expense' ? (
          <form className='mt-4 space-y-4' onSubmit={handleExpenseSubmit}>
            <label className='input w-full'>
              <span className='label text-xs uppercase text-base-content/50'>
                Date
              </span>
              <input
                type='date'
                value={expenseDate}
                onChange={(event) => setExpenseDate(event.target.value)}
                required
              />
            </label>
            <label className='select w-full'>
              <span className='label text-xs uppercase text-base-content/50'>
                Expense type
              </span>
              <select
                value={expenseType}
                onChange={(event) => setExpenseType(event.target.value)}
              >
                {expenseTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className='flex flex-col gap-2'>
              <label className='input validator w-full'>
                <span className='label text-xs uppercase text-base-content/50'>
                  Amount Paid
                  <i
                    className={`fa-solid ${getCurrencyIcon(
                      currency,
                    )} text-base-content/60`}
                  />
                </span>
                <input
                  type='number'
                  step='0.01'
                  min='0'
                  placeholder='e.g. 12.50'
                  id='entry-expense-amount'
                  value={expenseAmount}
                  onChange={(event) => setExpenseAmount(event.target.value)}
                  required
                />
              </label>
            </div>
            <label className='select w-full'>
              <span className='label text-xs uppercase text-base-content/50'>
                Vehicle profile
              </span>
              <select
                value={vehicleProfileId}
                onChange={(event) => setVehicleProfileId(event.target.value)}
              >
                <option value=''>None</option>
                {vehicleProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label} · {profile.vehicleType}
                  </option>
                ))}
              </select>
            </label>
            {isFuelExpense &&
              rateUnit === 'kwh' &&
              chargingVendors.length > 0 && (
                <label className='select w-full'>
                  <span className='label text-xs uppercase text-base-content/50'>
                    Charging vendor (optional)
                  </span>
                  <select
                    value={selectedVendorId}
                    onChange={(event) =>
                      setSelectedVendorId(event.target.value)
                    }
                  >
                    <option value=''>Choose vendor</option>
                    {chargingVendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.label} · {getVendorRateLabel(vendor)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            {isFuelExpense && selectedVehicle?.vehicleType === 'HYBRID' && (
              <div className='flex items-center gap-2 text-xs uppercase text-base-content/60'>
                {expenseModeOptions.map((option) => (
                  <button
                    key={option.value}
                    type='button'
                    className={`btn btn-ghost btn-xs ${
                      expenseMode === option.value
                        ? 'btn-active btn-primary'
                        : ''
                    }`}
                    onClick={() =>
                      setExpenseMode(option.value as 'fuel' | 'charging')
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            {isRateBasedExpense && (
              <div className='flex flex-col gap-2'>
                <label className='input validator w-full'>
                  <span className='label text-xs uppercase text-base-content/50'>
                    Rate (p/{rateLabel})
                  </span>
                  <input
                    type='number'
                    step='1'
                    min='0'
                    placeholder='e.g. 158'
                    value={expenseRate}
                    onChange={(event) => setExpenseRate(event.target.value)}
                    required={isRateBasedExpense}
                    id='entry-expense-rate'
                  />
                </label>
              </div>
            )}

            <label className='floating-label'>
              <span>Additional Notes</span>
              <textarea
                rows={3}
                value={expenseNotes}
                onChange={(event) => setExpenseNotes(event.target.value)}
                className='textarea w-full'
                placeholder='Additional Notes: Optional context, vendor, fees…'
              />
            </label>
            {formError && <p className='text-sm text-error'>{formError}</p>}
            <div className='modal-action'>
              <button
                type='button'
                className='btn btn-ghost'
                onClick={handleClose}
                disabled={isSubmittingExpense}
              >
                Cancel
              </button>
              <button
                type='submit'
                className={`btn btn-primary ${
                  isSubmittingExpense ? 'loading' : ''
                }`}
                disabled={isSubmittingExpense}
              >
                {editingExpense ? 'Save changes' : 'Add expense'}
              </button>
            </div>
          </form>
        ) : (
          <form className='mt-4 space-y-4' onSubmit={handleOdometerSubmit}>
            <label className='input w-full'>
              <span className='label text-xs uppercase text-base-content/50'>
                Date
              </span>
              <input
                type='date'
                value={odometerDate}
                onChange={(event) => setOdometerDate(event.target.value)}
                required
              />
            </label>
            <div className='grid gap-2 md:grid-cols-2'>
              <label className='input validator w-full'>
                <span className='label text-xs uppercase text-base-content/50'>
                  Start reading
                </span>
                <input
                  type='number'
                  step='0.1'
                  min='0'
                  placeholder='e.g. 12345.6'
                  value={odometerStartReading}
                  onChange={(event) =>
                    setOdometerStartReading(event.target.value)
                  }
                  required
                />
              </label>
              <label className='input validator w-full'>
                <span className='label text-xs uppercase text-base-content/50'>
                  End reading
                </span>
                <input
                  type='number'
                  step='0.1'
                  min='0'
                  placeholder='e.g. 12360.2'
                  value={odometerEndReading}
                  onChange={(event) =>
                    setOdometerEndReading(event.target.value)
                  }
                  required
                />
              </label>
            </div>
            <label className='select w-full'>
              <span className='label text-xs uppercase text-base-content/50'>
                Vehicle profile
              </span>
              <select
                value={odometerVehicleProfileId}
                onChange={(event) =>
                  setOdometerVehicleProfileId(event.target.value)
                }
              >
                <option value=''>None</option>
                {vehicleProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label} · {profile.vehicleType}
                  </option>
                ))}
              </select>
            </label>
            {formError && <p className='text-sm text-error'>{formError}</p>}
            <div className='modal-action'>
              <button
                type='button'
                className='btn btn-ghost'
                onClick={handleClose}
                disabled={isSubmittingOdometer}
              >
                Cancel
              </button>
              <button
                type='submit'
                className={`btn btn-primary ${
                  isSubmittingOdometer ? 'loading' : ''
                }`}
                disabled={isSubmittingOdometer}
              >
                {editingOdometer ? 'Save changes' : 'Add odometer reading'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EntryModal;
