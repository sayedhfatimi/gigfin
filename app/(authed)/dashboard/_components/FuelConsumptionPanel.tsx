'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ExpenseEntry, UnitRateUnit } from '@/lib/expenses';
import { useVehicleProfiles } from '@/lib/queries/vehicleProfiles';
import type { VehicleType } from '@/lib/vehicle';
import { vehicleTypeOptions } from '@/lib/vehicle';
import { getExpenseEntriesForTimeframe } from '../_lib/expenseBreakdownTimeframes';
import {
  type TimeframeKey,
  timeframeOptions,
} from '../_lib/platformBreakdownTimeframes';

type FuelConsumptionPanelProps = {
  expenses: ExpenseEntry[];
};

const VEHICLE_TYPE_LABELS = new Map<VehicleType, string>(
  vehicleTypeOptions.map((option) => [option.value, option.label]),
);

const UNIT_LABELS: Record<UnitRateUnit, string> = {
  kwh: 'kWh',
  litre: 'litres',
  gallon_us: 'gallons (US)',
  gallon_imp: 'gallons (Imperial)',
};

const ORDERED_UNITS: UnitRateUnit[] = [
  'kwh',
  'litre',
  'gallon_us',
  'gallon_imp',
];

const formatQuantity = (value: number) => {
  const decimals = value >= 10 ? 0 : value >= 1 ? 1 : 2;
  return value.toLocaleString(undefined, { maximumFractionDigits: decimals });
};

export function FuelConsumptionPanel({ expenses }: FuelConsumptionPanelProps) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>('monthly');
  const [vehicleFilter, setVehicleFilter] = useState('');

  const { data: vehicleProfiles = [], isLoading: areVehiclesLoading } =
    useVehicleProfiles();

  useEffect(() => {
    if (!vehicleFilter) {
      return;
    }
    if (!vehicleProfiles.some((profile) => profile.id === vehicleFilter)) {
      setVehicleFilter('');
    }
  }, [vehicleFilter, vehicleProfiles]);

  const selectedTimeframeOption =
    timeframeOptions.find((option) => option.value === timeframe) ??
    timeframeOptions[1];

  const timeframeExpenses = useMemo(
    () => getExpenseEntriesForTimeframe(expenses, timeframe),
    [expenses, timeframe],
  );

  const filteredEntries = useMemo(() => {
    if (!vehicleFilter) {
      return timeframeExpenses;
    }
    return timeframeExpenses.filter(
      (entry) => entry.vehicleProfileId === vehicleFilter,
    );
  }, [timeframeExpenses, vehicleFilter]);

  const { totals, entriesWithRate } = useMemo(() => {
    const unitTotals: Record<UnitRateUnit, number> = {
      kwh: 0,
      litre: 0,
      gallon_us: 0,
      gallon_imp: 0,
    };
    let rateCount = 0;
    filteredEntries.forEach((entry) => {
      if (
        !entry.unitRateMinor ||
        entry.unitRateMinor <= 0 ||
        !entry.unitRateUnit
      ) {
        return;
      }
      const quantity = entry.amountMinor / entry.unitRateMinor;
      unitTotals[entry.unitRateUnit] += quantity;
      rateCount += 1;
    });
    return { totals: unitTotals, entriesWithRate: rateCount };
  }, [filteredEntries]);

  const selectedVehicle = vehicleProfiles.find(
    (profile) => profile.id === vehicleFilter,
  );

  const selectedVehicleLabel = selectedVehicle
    ? `${selectedVehicle.label} · ${
        VEHICLE_TYPE_LABELS.get(selectedVehicle.vehicleType) ??
        selectedVehicle.vehicleType
      }`
    : 'All vehicles';

  const rows = ORDERED_UNITS.map((unit) => {
    const value = totals[unit];
    if (value <= 0) {
      return null;
    }
    return {
      unit,
      value,
    };
  }).filter(
    (row): row is { unit: UnitRateUnit; value: number } => row !== null,
  );

  const hasRows = rows.length > 0;

  const vehicleOptions = vehicleProfiles.map((profile) => ({
    value: profile.id,
    label: `${profile.label} · ${
      VEHICLE_TYPE_LABELS.get(profile.vehicleType) ?? profile.vehicleType
    }`,
  }));

  const descriptionText = filteredEntries.length
    ? `${filteredEntries.length} fuel log${
        filteredEntries.length === 1 ? '' : 's'
      }`
    : 'No fuel logs';

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>
            Fuel & energy consumption
          </h2>
          <p className='text-xs text-base-content/60'>
            {selectedTimeframeOption.label} ·{' '}
            {selectedTimeframeOption.description}
          </p>
          <p className='text-xs text-base-content/60'>{selectedVehicleLabel}</p>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3'>
          <label className='select select-xs max-w-fit'>
            <span className='label hidden md:block'>Timeframe</span>
            <select
              id='fuel-consumption-timeframe'
              value={timeframe}
              onChange={(event) =>
                setTimeframe(event.target.value as TimeframeKey)
              }
            >
              {timeframeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className='select select-xs max-w-fit'>
            <span className='label hidden md:block'>Vehicle</span>
            <select
              id='fuel-consumption-vehicle'
              value={vehicleFilter}
              onChange={(event) => setVehicleFilter(event.target.value)}
              disabled={areVehiclesLoading}
            >
              <option value=''>All vehicles</option>
              {vehicleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className='mt-6 space-y-4'>
        {hasRows ? (
          <ul className='space-y-3'>
            {rows.map((row) => (
              <li
                key={row.unit}
                className='flex items-center justify-between rounded border border-base-content/10 bg-base-200/50 p-3'
              >
                <span className='text-sm text-base-content/70'>
                  {UNIT_LABELS[row.unit]}
                </span>
                <span className='text-xl font-semibold text-base-content'>
                  {formatQuantity(row.value)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-sm text-base-content/60'>
            {filteredEntries.length === 0
              ? 'No fuel or charging logs for the selected timeframe.'
              : entriesWithRate === 0
                ? 'Fuel logs are missing unit rate data.'
                : 'Fuel consumption is being tracked. Adjust the filters for more detail.'}
          </p>
        )}
        <p className='text-xs text-base-content/60'>
          {descriptionText} · {entriesWithRate} logged with unit cost
        </p>
        {vehicleProfiles.length === 0 && !areVehiclesLoading && (
          <p className='text-xs text-base-content/50'>
            Add a vehicle profile from the account settings to filter fuel
            totals.
          </p>
        )}
      </div>
    </section>
  );
}
