'use client';

import type { CurrencyCode } from '@/lib/currency';
import { formatCurrency } from '@/lib/currency';
import {
  daysBetween,
  endOfDay,
  isInRange,
  parseDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from '@/lib/dates';
import type { IncomeEntry } from '@/lib/income';
import { useCallback, useEffect, useMemo, useState } from 'react';

type GoalType = 'weekly' | 'monthly';

type GoalTrackerProps = {
  incomes: IncomeEntry[];
  currency: CurrencyCode;
};

const GOAL_STORAGE_KEY = 'gigfin-income-goal';
const GOAL_TYPE_STORAGE_KEY = 'gigfin-income-goal-type';

export function GoalTrackerWidget({ incomes, currency }: GoalTrackerProps) {
  const [goalAmount, setGoalAmount] = useState<number | null>(null);
  const [goalType, setGoalType] = useState<GoalType>('weekly');
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Load from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedGoal = window.localStorage.getItem(GOAL_STORAGE_KEY);
    const storedType = window.localStorage.getItem(GOAL_TYPE_STORAGE_KEY);

    if (storedGoal) {
      const parsed = Number.parseFloat(storedGoal);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setGoalAmount(parsed);
        setInputValue(parsed.toString());
      }
    }

    if (storedType === 'weekly' || storedType === 'monthly') {
      setGoalType(storedType);
    }
  }, []);

  const saveGoal = useCallback((amount: number, type: GoalType) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(GOAL_STORAGE_KEY, amount.toString());
    window.localStorage.setItem(GOAL_TYPE_STORAGE_KEY, type);
    setGoalAmount(amount);
    setGoalType(type);
  }, []);

  const handleSaveGoal = () => {
    const parsed = Number.parseFloat(inputValue);
    if (!Number.isNaN(parsed) && parsed > 0) {
      saveGoal(parsed, goalType);
      setIsEditing(false);
    }
  };

  const handleClearGoal = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(GOAL_STORAGE_KEY);
      window.localStorage.removeItem(GOAL_TYPE_STORAGE_KEY);
    }
    setGoalAmount(null);
    setInputValue('');
    setIsEditing(false);
  };

  // Calculate current period income
  const now = useMemo(() => new Date(), []);

  const periodStart = useMemo(() => {
    return goalType === 'weekly' ? startOfWeek(now) : startOfMonth(now);
  }, [goalType, now]);

  const periodEnd = useMemo(() => endOfDay(now), [now]);

  const periodIncome = useMemo(() => {
    return incomes
      .filter((entry) => {
        const date = parseDate(entry.date);
        return date && isInRange(date, periodStart, periodEnd);
      })
      .reduce((acc, entry) => acc + entry.amount, 0);
  }, [incomes, periodStart, periodEnd]);

  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    if (goalType === 'weekly') {
      const weekEnd = new Date(periodStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return Math.max(0, daysBetween(startOfDay(now), weekEnd) + 1);
    }
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.max(0, daysBetween(startOfDay(now), monthEnd) + 1);
  }, [goalType, periodStart, now]);

  // Calculate progress
  const progress = goalAmount
    ? Math.min((periodIncome / goalAmount) * 100, 100)
    : 0;
  const remaining = goalAmount ? Math.max(goalAmount - periodIncome, 0) : 0;
  const dailyNeeded =
    daysRemaining > 0 && remaining > 0 ? remaining / daysRemaining : 0;
  const isComplete = goalAmount !== null && periodIncome >= goalAmount;

  // No goal set - show setup UI
  if (goalAmount === null || isEditing) {
    return (
      <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm overflow-hidden'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <h2 className='text-lg font-semibold text-base-content'>
              <span
                className='fa-solid fa-bullseye text-primary mr-2'
                aria-hidden='true'
              />
              Goal Tracker
            </h2>
            <p className='text-xs text-base-content/60'>
              Set an income target to track your progress
            </p>
          </div>
        </div>

        <div className='mt-6 space-y-4'>
          <div className='flex flex-col sm:flex-row gap-3'>
            <div className='flex-1'>
              <label className='label text-xs' htmlFor='goal-amount'>
                Target amount
              </label>
              <input
                type='number'
                id='goal-amount'
                className='input input-bordered w-full'
                placeholder='e.g. 1000'
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                min='0'
                step='50'
              />
            </div>
            <div>
              <label className='label text-xs' htmlFor='goal-type'>
                Period
              </label>
              <select
                id='goal-type'
                className='select select-bordered'
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as GoalType)}
              >
                <option value='weekly'>Weekly</option>
                <option value='monthly'>Monthly</option>
              </select>
            </div>
          </div>

          <div className='flex justify-end gap-2'>
            {isEditing && goalAmount !== null && (
              <button
                type='button'
                className='btn btn-ghost btn-sm'
                onClick={() => {
                  setInputValue(goalAmount.toString());
                  setIsEditing(false);
                }}
              >
                Cancel
              </button>
            )}
            <button
              type='button'
              className='btn btn-primary btn-sm'
              onClick={handleSaveGoal}
              disabled={!inputValue || Number.parseFloat(inputValue) <= 0}
            >
              <span className='fa-solid fa-check mr-1' aria-hidden='true' />
              Save Goal
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Goal set - show progress
  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm overflow-hidden'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold text-base-content flex items-center gap-2'>
            <span
              className={`fa-solid ${
                isComplete
                  ? 'fa-circle-check text-success'
                  : 'fa-bullseye text-primary'
              }`}
              aria-hidden='true'
            />
            {goalType === 'weekly' ? 'Weekly' : 'Monthly'} Goal
          </h2>
          <p className='text-xs text-base-content/60'>
            {isComplete
              ? 'Congratulations! Goal reached!'
              : `${daysRemaining} day${
                  daysRemaining === 1 ? '' : 's'
                } remaining`}
          </p>
        </div>
        <div className='dropdown dropdown-end'>
          <button
            type='button'
            className='btn btn-ghost btn-sm btn-square'
            aria-label='Goal options'
          >
            <span
              className='fa-solid fa-ellipsis-vertical'
              aria-hidden='true'
            />
          </button>
          <ul className='dropdown-content menu rounded-box z-10 w-40 border border-base-content/10 bg-base-100 p-2 shadow-lg'>
            <li>
              <button type='button' onClick={() => setIsEditing(true)}>
                <span className='fa-solid fa-pen' aria-hidden='true' />
                Edit goal
              </button>
            </li>
            <li>
              <button
                type='button'
                onClick={handleClearGoal}
                className='text-error'
              >
                <span className='fa-solid fa-trash' aria-hidden='true' />
                Clear goal
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className='mt-6 space-y-4'>
        {/* Progress bar */}
        <div>
          <div className='flex items-center justify-between text-sm mb-2'>
            <span className='font-semibold text-base-content'>
              {formatCurrency(periodIncome, currency)}
            </span>
            <span className='text-base-content/60'>
              of {formatCurrency(goalAmount, currency)}
            </span>
          </div>
          <progress
            className={`progress w-full ${
              isComplete ? 'progress-success' : 'progress-primary'
            }`}
            value={progress}
            max={100}
            aria-label={`${progress.toFixed(0)}% of goal reached`}
          />
          <p className='text-right text-xs text-base-content/50 mt-1'>
            {progress.toFixed(0)}% complete
          </p>
        </div>

        {/* Stats grid */}
        <div className='grid gap-3 sm:grid-cols-3'>
          <div className='rounded-lg border border-base-content/10 bg-base-200/50 p-3'>
            <p className='text-xs uppercase text-base-content/60'>Earned</p>
            <p className='text-xl font-bold text-primary'>
              {formatCurrency(periodIncome, currency)}
            </p>
          </div>
          <div className='rounded-lg border border-base-content/10 bg-base-200/50 p-3'>
            <p className='text-xs uppercase text-base-content/60'>Remaining</p>
            <p
              className={`text-xl font-bold ${
                isComplete ? 'text-success' : 'text-base-content'
              }`}
            >
              {isComplete ? 'Done!' : formatCurrency(remaining, currency)}
            </p>
          </div>
          <div className='rounded-lg border border-base-content/10 bg-base-200/50 p-3'>
            <p className='text-xs uppercase text-base-content/60'>Daily pace</p>
            <p className='text-xl font-bold text-secondary'>
              {isComplete ? '—' : formatCurrency(dailyNeeded, currency)}
            </p>
            <p className='text-xs text-base-content/50'>
              {isComplete ? 'Goal reached' : 'needed per day'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
