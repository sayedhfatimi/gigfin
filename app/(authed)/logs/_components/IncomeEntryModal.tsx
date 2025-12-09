'use client';

import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import type { IncomeEntry } from '@/lib/income';
import { useAddIncome, useUpdateIncome } from '@/lib/queries/income';

const incomeSources = [
  'Uber Eats',
  'Deliveroo',
  'Just Eat',
  'Amazon Flex',
  'Lyft',
  'DoorDash',
  'Other',
];

const dateInputId = 'gigfin-income-date';
const dateHintId = `${dateInputId}-hint`;
const calendarPopoverId = `${dateInputId}-popover`;
const platformSelectId = 'gigfin-income-platform';
const amountInputId = 'gigfin-income-amount';

type FormState = {
  date: string;
  platform: string;
  amount: string;
};

const getDefaultFormState = (): FormState => ({
  date: new Date().toISOString().split('T')[0],
  platform: incomeSources[0],
  amount: '',
});

const toIsoDate = (date: Date) => date.toISOString().split('T')[0];

const parseIsoDate = (value: string) => {
  if (!value) {
    return undefined;
  }
  const [yearStr, monthStr, dayStr] = value.split('-');
  if (!yearStr || !monthStr || !dayStr) {
    return undefined;
  }
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if ([year, month, day].some(Number.isNaN)) {
    return undefined;
  }
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }
  return date;
};

const formatSelectedDateLabel = (value: string) => {
  if (!value) {
    return 'Selected date';
  }
  const [year, month, day] = value.split('-').map(Number);
  if ([year, month, day].some(Number.isNaN)) {
    return 'Selected date';
  }
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(year, month - 1, day));
};

interface IncomeEntryModalProps {
  isOpen: boolean;
  editingEntry: IncomeEntry | null;
  onClose: () => void;
}

const IncomeEntryModal = ({
  isOpen,
  editingEntry,
  onClose,
}: IncomeEntryModalProps) => {
  const addIncomeMutation = useAddIncome();
  const updateIncomeMutation = useUpdateIncome();
  const [formState, setFormState] = useState<FormState>(() =>
    getDefaultFormState(),
  );
  const [formError, setFormError] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarTriggerRef = useRef<HTMLButtonElement | null>(null);
  const calendarPopoverRef = useRef<HTMLDivElement | null>(null);

  const selectedDateLabel = useMemo(
    () => formatSelectedDateLabel(formState.date),
    [formState.date],
  );
  const selectedDay = useMemo(
    () => parseIsoDate(formState.date),
    [formState.date],
  );

  useEffect(() => {
    if (!isOpen) {
      setIsCalendarOpen(false);
      return;
    }
    setFormError('');
    if (editingEntry) {
      setFormState({
        date: editingEntry.date,
        platform: editingEntry.platform,
        amount: editingEntry.amount.toString(),
      });
    } else {
      setFormState(getDefaultFormState());
    }
  }, [isOpen, editingEntry]);

  useEffect(() => {
    if (!isCalendarOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarPopoverRef.current?.contains(event.target as Node) ||
        calendarTriggerRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setIsCalendarOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isCalendarOpen]);

  const handleDaySelect = (day?: Date) => {
    if (!day) {
      return;
    }
    setFormState((prev) => ({ ...prev, date: toIsoDate(day) }));
    setIsCalendarOpen(false);
  };

  const resetForm = () => {
    setFormState(getDefaultFormState());
    setFormError('');
    setIsCalendarOpen(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isSubmitting =
    addIncomeMutation.isPending || updateIncomeMutation.isPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number.parseFloat(formState.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      setFormError('Enter a valid amount greater than zero.');
      return;
    }
    setFormError('');

    const payload = {
      date: formState.date,
      platform: formState.platform,
      amount,
    };

    if (editingEntry) {
      updateIncomeMutation.mutate(
        {
          ...payload,
          id: editingEntry.id,
        },
        {
          onSuccess: handleClose,
        },
      );
      return;
    }

    addIncomeMutation.mutate(payload, {
      onSuccess: handleClose,
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className='modal modal-open'>
      <div className='modal-box'>
        <h3 className='text-lg font-semibold text-base-content'>
          {editingEntry ? 'Update income entry' : 'Log new income'}
        </h3>
        <form className='mt-4 space-y-4' onSubmit={handleSubmit}>
          <div className='flex flex-col gap-2'>
            <div className='flex flex-row items-center justify-between'>
              <label
                htmlFor={dateInputId}
                className='text-xs font-semibold uppercase text-base-content/50'
              >
                Date
              </label>
              <p className='text-sm text-base-content/70'>
                {selectedDateLabel}
              </p>
            </div>
            <div className='flex-1 min-w-0'>
              <label className='input w-full'>
                <input
                  type='text'
                  id={dateInputId}
                  aria-describedby={dateHintId}
                  required
                  placeholder='YYYY-MM-DD'
                  value={formState.date}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      date: event.target.value,
                    }))
                  }
                />
                <button
                  type='button'
                  className='btn btn-ghost btn-square btn-xs'
                  onClick={() => setIsCalendarOpen((prev) => !prev)}
                  aria-haspopup='dialog'
                  aria-expanded={isCalendarOpen}
                  aria-controls={calendarPopoverId}
                  ref={calendarTriggerRef}
                >
                  <span
                    className='fa-solid fa-calendar-days text-xs text-base-content'
                    aria-hidden='true'
                  />
                  <span className='sr-only'>
                    {isCalendarOpen ? 'Close calendar' : 'Open calendar'}
                  </span>
                </button>
              </label>
              <p id={dateHintId} className='text-xs text-base-content/60 mt-1'>
                Format: YYYY-MM-DD (press calendar icon for a picker)
              </p>
              <div
                ref={calendarPopoverRef}
                id={calendarPopoverId}
                role='dialog'
                aria-label='Calendar date picker'
                className={`absolute right-3 z-40 w-[218px] max-w-[90vw] border border-base-content/15 bg-base-100 p-2 shadow-2xl transition-all duration-150 ${
                  isCalendarOpen ? 'block' : 'hidden'
                }`}
              >
                <div className='border border-base-content/10 bg-base-200 p-2'>
                  <DayPicker
                    mode='single'
                    selected={selectedDay}
                    onSelect={handleDaySelect}
                    className='gigfin-daypicker'
                  />
                </div>
              </div>
            </div>
          </div>
          <label className='select w-full'>
            <span className='label'>Platform</span>
            <select
              id={platformSelectId}
              value={formState.platform}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  platform: event.target.value,
                }))
              }
            >
              {incomeSources.map((source) => (
                <option key={source}>{source}</option>
              ))}
            </select>
          </label>
          <div className='flex flex-col gap-2'>
            <label
              htmlFor={amountInputId}
              className='text-xs font-semibold uppercase text-base-content/50'
            >
              Amount earned
            </label>
            <label className='input validator w-full'>
              <span
                className='fa-solid fa-sterling-sign text-base-content/60'
                aria-hidden='true'
              />
              <input
                type='number'
                step='0.01'
                min='0'
                required
                placeholder='e.g. 45.50'
                id={amountInputId}
                value={formState.amount}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    amount: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          {formError && <p className='text-sm text-error'>{formError}</p>}
          <div className='modal-action'>
            <button
              type='button'
              className='btn btn-ghost'
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type='submit'
              className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              {editingEntry ? 'Save changes' : 'Add income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncomeEntryModal;
