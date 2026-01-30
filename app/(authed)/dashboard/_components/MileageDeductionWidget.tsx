'use client';

import { useMemo, useState } from 'react';
import type { OdometerEntry, OdometerUnit } from '@/lib/odometer';
import { getOdometerDistance } from '@/lib/odometer';

interface MileageDeductionWidgetProps {
  odometerEntries: OdometerEntry[];
  odometerUnit?: OdometerUnit;
  currency?: string;
  timeframe?: 'monthly' | 'yearly';
}

interface MileageSettings {
  // HMRC Approved Mileage Allowance Payments (AMAP)
  rateFirst10k: number; // 45p per mile for first 10,000
  rateOver10k: number; // 25p per mile over 10,000
  ratePerKm: number; // For km users (converted from miles)
  businessUsePercentage: number; // Default 100% for gig work
}

// HMRC 2024/25 rates for cars and vans
const DEFAULT_SETTINGS: MileageSettings = {
  rateFirst10k: 0.45, // 45p per mile
  rateOver10k: 0.25, // 25p per mile over 10k
  ratePerKm: 0.28, // ~45p/mile converted to km (approx)
  businessUsePercentage: 100,
};

export function MileageDeductionWidget({
  odometerEntries,
  odometerUnit = 'miles',
  currency = 'GBP',
  timeframe = 'yearly',
}: MileageDeductionWidgetProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<MileageSettings>(DEFAULT_SETTINGS);

  const calculations = useMemo(() => {
    if (odometerEntries.length === 0) {
      return {
        hasData: false,
        totalDistance: 0,
        businessDistance: 0,
        deduction: 0,
        averagePerDay: 0,
        daysTracked: 0,
        monthlyBreakdown: [],
        milesAt45p: 0,
        milesAt25p: 0,
      };
    }

    // Calculate total distance
    const totalDistance = odometerEntries.reduce(
      (sum, entry) => sum + getOdometerDistance(entry),
      0,
    );

    // Business use distance
    const businessDistance =
      totalDistance * (settings.businessUsePercentage / 100);

    // Calculate HMRC tiered deduction (only applies to miles)
    let deduction = 0;
    let milesAt45p = 0;
    let milesAt25p = 0;

    if (odometerUnit === 'miles') {
      // First 10,000 miles at 45p
      milesAt45p = Math.min(businessDistance, 10000);
      // Miles over 10,000 at 25p
      milesAt25p = Math.max(0, businessDistance - 10000);

      deduction =
        milesAt45p * settings.rateFirst10k + milesAt25p * settings.rateOver10k;
    } else {
      // For km, use simplified flat rate
      deduction = businessDistance * settings.ratePerKm;
    }

    // Calculate days tracked
    const uniqueDays = new Set(odometerEntries.map((e) => e.date));
    const daysTracked = uniqueDays.size;

    // Average per day
    const averagePerDay = daysTracked > 0 ? totalDistance / daysTracked : 0;

    // Monthly breakdown - needs to track cumulative miles for tiered rate
    const monthlyMap = new Map<string, number>();
    for (const entry of odometerEntries) {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, '0')}`;
      const distance = getOdometerDistance(entry);
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + distance);
    }

    // For monthly breakdown, use simple average rate for display
    const avgRate =
      businessDistance > 0
        ? deduction / businessDistance
        : settings.rateFirst10k;

    const monthlyBreakdown = Array.from(monthlyMap.entries())
      .map(([month, distance]) => ({
        month,
        distance,
        deduction: distance * (settings.businessUsePercentage / 100) * avgRate,
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6);

    return {
      hasData: true,
      totalDistance,
      businessDistance,
      deduction,
      averagePerDay,
      daysTracked,
      monthlyBreakdown,
      milesAt45p,
      milesAt25p,
    };
  }, [
    odometerEntries,
    odometerUnit,
    settings.businessUsePercentage,
    settings.ratePerKm,
    settings.rateFirst10k,
    settings.rateOver10k,
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDistance = (value: number) => {
    const unit = odometerUnit === 'miles' ? 'mi' : 'km';
    return `${value.toLocaleString('en-GB', {
      maximumFractionDigits: 1,
    })} ${unit}`;
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(
      Number.parseInt(year, 10),
      Number.parseInt(month, 10) - 1,
    );
    return date.toLocaleDateString('en-GB', {
      month: 'short',
      year: '2-digit',
    });
  };

  if (!calculations.hasData) {
    return (
      <div className='card bg-base-100 shadow-sm overflow-hidden'>
        <div className='card-body'>
          <h2 className='card-title text-base font-semibold'>
            <i className='fa-solid fa-car text-primary' />
            Mileage Deduction
          </h2>
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <i className='fa-solid fa-car text-4xl text-base-300 mb-3' />
            <p className='text-base-content/60 text-sm'>
              No odometer data yet.
            </p>
            <p className='text-base-content/40 text-xs mt-1'>
              Log your daily mileage to calculate deductions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const timeframeLabel = timeframe === 'yearly' ? 'Annual' : 'Monthly';

  return (
    <div className='card bg-base-100 shadow-sm overflow-hidden'>
      <div className='card-body'>
        <div className='flex items-center justify-between'>
          <h2 className='card-title text-base font-semibold'>
            <i className='fa-solid fa-car text-primary' />
            Mileage Deduction
          </h2>
          <div className='flex items-center gap-2'>
            <span className='badge badge-ghost badge-sm'>{timeframeLabel}</span>
            <button
              type='button'
              className='btn btn-ghost btn-xs btn-circle'
              onClick={() => setShowSettings(!showSettings)}
              title='Mileage settings'
            >
              <i className='fa-solid fa-gear' />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className='mt-3 p-3 bg-base-200 rounded-lg space-y-3'>
            {odometerUnit === 'miles' ? (
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label
                    className='label label-text text-xs'
                    htmlFor='rateFirst10k'
                  >
                    First 10,000 miles
                  </label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60'>
                      £
                    </span>
                    <input
                      id='rateFirst10k'
                      type='number'
                      className='input input-sm input-bordered w-full pl-7'
                      value={settings.rateFirst10k}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          rateFirst10k: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      step='0.01'
                      min='0'
                    />
                  </div>
                </div>
                <div>
                  <label
                    className='label label-text text-xs'
                    htmlFor='rateOver10k'
                  >
                    Over 10,000 miles
                  </label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60'>
                      £
                    </span>
                    <input
                      id='rateOver10k'
                      type='number'
                      className='input input-sm input-bordered w-full pl-7'
                      value={settings.rateOver10k}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          rateOver10k: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      step='0.01'
                      min='0'
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className='label label-text text-xs' htmlFor='ratePerKm'>
                  Rate per km
                </label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60'>
                    £
                  </span>
                  <input
                    id='ratePerKm'
                    type='number'
                    className='input input-sm input-bordered w-full pl-7'
                    value={settings.ratePerKm}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ratePerKm: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    step='0.01'
                    min='0'
                  />
                </div>
              </div>
            )}
            <div>
              <label className='label label-text text-xs' htmlFor='businessUse'>
                Business Use %
              </label>
              <input
                id='businessUse'
                type='number'
                className='input input-sm input-bordered w-full'
                value={settings.businessUsePercentage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    businessUsePercentage: Math.min(
                      100,
                      Math.max(0, Number.parseInt(e.target.value, 10) || 0),
                    ),
                  })
                }
                min='0'
                max='100'
              />
            </div>
            <p className='text-xs text-base-content/50'>
              HMRC 2024/25: 45p/mile (first 10k), 25p/mile (over 10k)
            </p>
          </div>
        )}

        {/* Main Deduction */}
        <div className='mt-4 text-center'>
          <div className='text-3xl font-bold text-success'>
            {formatCurrency(calculations.deduction)}
          </div>
          <div className='text-sm text-base-content/60'>
            Estimated Tax Deduction
          </div>
        </div>

        {/* Stats Grid */}
        <div className='mt-4 grid grid-cols-2 gap-3'>
          <div className='rounded-lg bg-base-200 p-3'>
            <div className='flex items-center gap-1 text-xs text-base-content/60'>
              <i className='fa-solid fa-arrow-trend-up text-xs' />
              Total Distance
            </div>
            <div className='mt-1 text-lg font-semibold'>
              {formatDistance(calculations.totalDistance)}
            </div>
            {settings.businessUsePercentage < 100 && (
              <div className='text-xs text-base-content/50'>
                {formatDistance(calculations.businessDistance)} business
              </div>
            )}
          </div>
          <div className='rounded-lg bg-base-200 p-3'>
            <div className='flex items-center gap-1 text-xs text-base-content/60'>
              <i className='fa-solid fa-calendar text-xs' />
              Days Tracked
            </div>
            <div className='mt-1 text-lg font-semibold'>
              {calculations.daysTracked}
            </div>
            <div className='text-xs text-base-content/50'>
              {formatDistance(calculations.averagePerDay)}/day avg
            </div>
          </div>
        </div>

        {/* Monthly Breakdown */}
        {calculations.monthlyBreakdown.length > 0 && (
          <div className='mt-4'>
            <h3 className='text-xs font-medium text-base-content/60 mb-2'>
              Recent Months
            </h3>
            <div className='space-y-2'>
              {calculations.monthlyBreakdown.slice(0, 4).map((month) => (
                <div
                  key={month.month}
                  className='flex items-center justify-between text-sm'
                >
                  <span className='text-base-content/70'>
                    {formatMonth(month.month)}
                  </span>
                  <div className='flex items-center gap-3'>
                    <span className='text-base-content/50'>
                      {formatDistance(month.distance)}
                    </span>
                    <span className='font-medium text-success'>
                      {formatCurrency(month.deduction)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className='mt-4 text-xs text-base-content/40 text-center'>
          Keep detailed mileage logs for HMRC compliance
        </div>
      </div>
    </div>
  );
}
