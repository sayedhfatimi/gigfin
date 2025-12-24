'use client';

import type { ReactNode } from 'react';

import type { OdometerEntry, OdometerUnit } from '@/lib/odometer';
import LoadingState from './LoadingState';
import OdometerLogRow from './OdometerLogRow';

export type OdometerTableProps = {
  entries: OdometerEntry[];
  isLoading: boolean;
  onCreateEntry: () => void;
  onEditEntry: (entry: OdometerEntry) => void;
  onDeleteEntry: (entry: OdometerEntry) => void;
  deleteDisabled: boolean;
  vehicleFilterControl?: ReactNode | null;
  odometerUnit: OdometerUnit;
};

export default function OdometerTable({
  entries,
  isLoading,
  onCreateEntry,
  onEditEntry,
  onDeleteEntry,
  deleteDisabled,
  vehicleFilterControl,
  odometerUnit,
}: OdometerTableProps) {
  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm space-y-4'>
      {vehicleFilterControl && (
        <div className='flex flex-col gap-2 text-sm text-base-content/70 md:flex-row md:items-center md:justify-between'>
          <span className='text-xs uppercase'>Vehicles</span>
          <div>{vehicleFilterControl}</div>
        </div>
      )}
      {isLoading ? (
        <LoadingState message='Loading odometer logs…' />
      ) : entries.length === 0 ? (
        <div className='flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-base-content/60'>
          <p>No odometer readings logged yet.</p>
          <button
            type='button'
            className='btn btn-xs btn-outline'
            onClick={onCreateEntry}
          >
            Log odometer reading
          </button>
        </div>
      ) : (
        <div className='space-y-3'>
          {entries.map((entry) => (
            <OdometerLogRow
              key={entry.id}
              entry={entry}
              onEdit={onEditEntry}
              onDelete={onDeleteEntry}
              deleteDisabled={deleteDisabled}
              odometerUnit={odometerUnit}
            />
          ))}
        </div>
      )}
    </section>
  );
}
