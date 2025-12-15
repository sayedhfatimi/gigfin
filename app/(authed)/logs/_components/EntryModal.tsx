'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import type { CurrencyCode } from '@/lib/currency';
import { getCurrencyIcon } from '@/lib/currency';
import type { ExpenseEntry, UnitRateUnit } from '@/lib/expenses';
import { expenseTypeOptions } from '@/lib/expenses';
import type { IncomeEntry } from '@/lib/income';
import type { ExpensePayload } from '@/lib/queries/expenses';
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

type EntryTab = 'income' | 'expense';

type EntryModalProps = {
  isOpen: boolean;
  activeTab: EntryTab;
  onTabChange: (value: EntryTab) => void;
  currency: CurrencyCode;
  vehicleProfiles: VehicleProfile[];
  volumeUnit: UnitRateUnit;
  editingIncome: IncomeEntry | null;
  editingExpense: ExpenseEntry | null;
  onSubmitIncome: (payload: {
    id?: string;
    date: string;
    platform: string;
    amount: number;
  }) => Promise<void>;
  onSubmitExpense: (payload: ExpensePayload & { id?: string }) => Promise<void>;
  isSubmittingIncome: boolean;
  isSubmittingExpense: boolean;
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
  onSubmitIncome,
  onSubmitExpense,
  isSubmittingIncome,
  isSubmittingExpense,
  onClose,
}: EntryModalProps) => {
  const isEditingIncome = Boolean(editingIncome);
  const isEditingExpense = Boolean(editingExpense);
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
    } else {
      setExpenseDate(getTodayIso());
      setExpenseType(expenseTypeOptions[0].value);
      setExpenseAmount('');
      setExpenseNotes('');
      setVehicleProfileId('');
      setExpenseRate('');
      setExpenseMode('fuel');
    }
  }, [editingExpense, isOpen]);

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

  if (!isOpen) {
    return null;
  }

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

  const title =
    activeTab === 'income'
      ? editingIncome
        ? 'Update income entry'
        : 'Log new income'
      : editingExpense
        ? 'Update expense entry'
        : 'Log new expense';

  return (
    <div className='modal modal-open'>
      <div className='modal-box'>
        <div className='flex flex-row justify-between items-center gap-2'>
          <h3 className='text-lg font-semibold text-base-content'>{title}</h3>

          <div role='tablist' className='tabs tabs-box'>
            {(['income', 'expense'] as EntryTab[]).map((tab) => {
              const isTabDisabled =
                (tab === 'income' && isEditingExpense) ||
                (tab === 'expense' && isEditingIncome);
              return (
                <input
                  key={tab}
                  type='radio'
                  name='entry-modal-tabs'
                  className='tab'
                  aria-label={tab === 'income' ? 'Income' : 'Expense'}
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
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default EntryModal;
