'use client';

import type { Expense } from '@/lib/expenses';
import type { IncomeEntry } from '@/lib/income';
import { useMemo, useState } from 'react';

interface TaxEstimatorWidgetProps {
  incomes: IncomeEntry[];
  expenses: Expense[];
  currency?: string;
  timeframe?: 'monthly' | 'yearly';
}

interface TaxSettings {
  // UK Income Tax Bands (2024/25)
  incomeTaxBands: { min: number; max: number; rate: number }[];
  personalAllowance: number;
  // UK National Insurance Class 4 (self-employed)
  class4LowerLimit: number;
  class4UpperLimit: number;
  class4MainRate: number; // 9% between limits
  class4AdditionalRate: number; // 2% above upper limit
  // Class 2 NI (weekly flat rate)
  class2WeeklyRate: number;
  class2Threshold: number;
  // Payments on account made
  paymentsOnAccount: number[];
}

// UK Tax Year 2024/25 rates
const DEFAULT_UK_SETTINGS: TaxSettings = {
  personalAllowance: 12570,
  incomeTaxBands: [
    { min: 0, max: 12570, rate: 0 }, // Personal allowance
    { min: 12570, max: 50270, rate: 0.2 }, // Basic rate
    { min: 50270, max: 125140, rate: 0.4 }, // Higher rate
    { min: 125140, max: Number.POSITIVE_INFINITY, rate: 0.45 }, // Additional rate
  ],
  class4LowerLimit: 12570,
  class4UpperLimit: 50270,
  class4MainRate: 0.09, // 9%
  class4AdditionalRate: 0.02, // 2%
  class2WeeklyRate: 3.45,
  class2Threshold: 12570,
  paymentsOnAccount: [0, 0], // Two payments on account per year
};

export function TaxEstimatorWidget({
  incomes,
  expenses,
  currency = 'GBP',
  timeframe = 'yearly',
}: TaxEstimatorWidgetProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<TaxSettings>(DEFAULT_UK_SETTINGS);

  const calculations = useMemo(() => {
    // Calculate gross income
    const grossIncome = incomes.reduce(
      (sum, inc) => sum + (inc.amount ?? 0),
      0,
    );

    // Calculate deductible expenses (all business expenses)
    const deductibleExpenses = expenses.reduce(
      (sum, exp) => sum + exp.amountMinor / 100,
      0,
    );

    // Net self-employment profit
    const netIncome = grossIncome - deductibleExpenses;

    // UK Income Tax calculation
    let incomeTax = 0;
    if (netIncome > settings.personalAllowance) {
      const taxableIncome = netIncome - settings.personalAllowance;

      // Apply progressive tax bands
      for (const band of settings.incomeTaxBands) {
        if (band.rate === 0) continue; // Skip personal allowance band

        const bandStart = Math.max(0, band.min - settings.personalAllowance);
        const bandEnd =
          band.max === Number.POSITIVE_INFINITY
            ? Number.POSITIVE_INFINITY
            : band.max - settings.personalAllowance;
        const bandWidth = bandEnd - bandStart;

        if (taxableIncome > bandStart) {
          const taxableInBand = Math.min(taxableIncome - bandStart, bandWidth);
          incomeTax += taxableInBand * band.rate;
        }
      }
    }

    // UK National Insurance Class 4 calculation
    let class4NI = 0;
    if (netIncome > settings.class4LowerLimit) {
      // Main rate: 9% on profits between lower and upper limits
      const mainRateProfits = Math.min(
        Math.max(0, netIncome - settings.class4LowerLimit),
        settings.class4UpperLimit - settings.class4LowerLimit,
      );
      class4NI += mainRateProfits * settings.class4MainRate;

      // Additional rate: 2% on profits above upper limit
      if (netIncome > settings.class4UpperLimit) {
        const additionalProfits = netIncome - settings.class4UpperLimit;
        class4NI += additionalProfits * settings.class4AdditionalRate;
      }
    }

    // Class 2 NI (weekly flat rate, ~52 weeks per year)
    const class2NI =
      netIncome > settings.class2Threshold ? settings.class2WeeklyRate * 52 : 0;

    // Total National Insurance
    const totalNI = class4NI + class2NI;

    // Total estimated tax
    const totalTax = incomeTax + totalNI;

    // Payments on account made
    const paidOnAccount = settings.paymentsOnAccount.reduce((a, b) => a + b, 0);

    // Remaining tax liability
    const remainingLiability = totalTax - paidOnAccount;

    // Effective tax rate
    const effectiveTaxRate = grossIncome > 0 ? totalTax / grossIncome : 0;

    // Monthly set-aside recommendation (UK tax year ends in April)
    const currentMonth = new Date().getMonth(); // 0 = Jan
    // Tax year runs April to April, calculate months until 31 Jan payment deadline
    const monthsUntilPayment =
      currentMonth >= 1 ? 13 - currentMonth : 1 - currentMonth;
    const monthlySetAside =
      monthsUntilPayment > 0
        ? Math.max(0, remainingLiability) / monthsUntilPayment
        : 0;

    return {
      grossIncome,
      deductibleExpenses,
      netIncome,
      incomeTax,
      class4NI,
      class2NI,
      totalNI,
      totalTax,
      paidOnAccount,
      remainingLiability,
      effectiveTaxRate,
      monthlySetAside,
    };
  }, [incomes, expenses, settings]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className='card bg-base-100 shadow-sm overflow-hidden'>
      <div className='card-body'>
        <div className='flex items-center justify-between'>
          <h2 className='card-title text-base font-semibold'>
            <i className='fa-solid fa-calculator text-primary' />
            Tax Estimator
          </h2>
          <div className='flex items-center gap-2'>
            <span className='badge badge-ghost badge-sm'>
              {timeframe === 'yearly' ? 'Annual' : 'Monthly'}
            </span>
            <button
              type='button'
              className='btn btn-ghost btn-xs btn-circle'
              onClick={() => setShowSettings(!showSettings)}
              title='Tax settings'
            >
              <i className='fa-solid fa-gear' />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className='mt-3 p-3 bg-base-200 rounded-lg space-y-3'>
            <div className='flex items-center gap-2 text-sm font-medium'>
              <i className='fa-solid fa-circle-info text-info' />
              Tax Settings (UK 2024/25)
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label
                  className='label label-text text-xs'
                  htmlFor='class4MainRate'
                >
                  Class 4 NI Main Rate
                </label>
                <input
                  id='class4MainRate'
                  type='number'
                  className='input input-sm input-bordered w-full'
                  value={(settings.class4MainRate * 100).toFixed(1)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      class4MainRate: Number.parseFloat(e.target.value) / 100,
                    })
                  }
                  step='0.1'
                  min='0'
                  max='100'
                />
              </div>
              <div>
                <label
                  className='label label-text text-xs'
                  htmlFor='personalAllowance'
                >
                  Personal Allowance
                </label>
                <input
                  id='personalAllowance'
                  type='number'
                  className='input input-sm input-bordered w-full'
                  value={settings.personalAllowance}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      personalAllowance: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  step='1'
                  min='0'
                />
              </div>
            </div>
            <fieldset>
              <legend className='label label-text text-xs'>
                Payments on Account Made
              </legend>
              <div className='grid grid-cols-2 gap-2'>
                {['31 Jan', '31 Jul'].map((dateLabel, idx) => (
                  <input
                    key={dateLabel}
                    type='number'
                    className='input input-sm input-bordered w-full'
                    placeholder={dateLabel}
                    aria-label={`Payment on account for ${dateLabel}`}
                    value={settings.paymentsOnAccount[idx] || ''}
                    onChange={(e) => {
                      const newPayments = [...settings.paymentsOnAccount];
                      newPayments[idx] = Number.parseFloat(e.target.value) || 0;
                      setSettings({
                        ...settings,
                        paymentsOnAccount: newPayments,
                      });
                    }}
                  />
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {/* Main Summary */}
        <div className='mt-4'>
          {/* Estimated Tax */}
          <div className='text-center mb-4'>
            <div className='text-3xl font-bold text-error'>
              {formatCurrency(calculations.totalTax)}
            </div>
            <div className='text-sm text-base-content/60'>
              Estimated Total Tax
            </div>
            <div className='mt-1 badge badge-sm badge-ghost'>
              {formatPercent(calculations.effectiveTaxRate)} effective rate
            </div>
          </div>

          {/* Breakdown */}
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-base-content/60'>Gross Income</span>
              <span className='font-medium'>
                {formatCurrency(calculations.grossIncome)}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-base-content/60'>Business Expenses</span>
              <span className='font-medium text-success'>
                -{formatCurrency(calculations.deductibleExpenses)}
              </span>
            </div>
            <div className='divider my-1' />
            <div className='flex justify-between'>
              <span className='text-base-content/60'>Net Profit</span>
              <span className='font-medium'>
                {formatCurrency(calculations.netIncome)}
              </span>
            </div>
            <div className='divider my-1' />
            <div className='flex justify-between text-xs'>
              <span className='text-base-content/40'>Income Tax</span>
              <span>{formatCurrency(calculations.incomeTax)}</span>
            </div>
            <div className='flex justify-between text-xs'>
              <span className='text-base-content/40'>Class 4 NI</span>
              <span>{formatCurrency(calculations.class4NI)}</span>
            </div>
            <div className='flex justify-between text-xs'>
              <span className='text-base-content/40'>Class 2 NI</span>
              <span>{formatCurrency(calculations.class2NI)}</span>
            </div>
          </div>

          {/* Payments on Account Progress */}
          {calculations.paidOnAccount > 0 && (
            <div className='mt-4 p-3 bg-base-200 rounded-lg'>
              <div className='flex justify-between text-sm mb-2'>
                <span>Payments on Account</span>
                <span className='font-medium text-success'>
                  {formatCurrency(calculations.paidOnAccount)}
                </span>
              </div>
              <progress
                className='progress progress-success w-full'
                value={calculations.paidOnAccount}
                max={calculations.totalTax}
              />
              <div className='flex justify-between text-xs text-base-content/60 mt-1'>
                <span>Paid</span>
                <span>
                  {formatCurrency(Math.max(0, calculations.remainingLiability))}{' '}
                  remaining
                </span>
              </div>
            </div>
          )}

          {/* Monthly Set-Aside Recommendation */}
          <div className='mt-4 p-3 bg-warning/10 rounded-lg'>
            <div className='flex items-center gap-2'>
              <i className='fa-solid fa-arrow-trend-up text-warning' />
              <span className='text-sm font-medium'>Set Aside Monthly</span>
            </div>
            <div className='text-2xl font-bold text-warning mt-1'>
              {formatCurrency(calculations.monthlySetAside)}
            </div>
            <div className='text-xs text-base-content/60'>
              for 31 January payment deadline
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className='mt-4 text-xs text-base-content/40 text-center'>
          Estimates only. Consult an accountant.
        </div>
      </div>
    </div>
  );
}
