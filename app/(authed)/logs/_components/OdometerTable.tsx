'use client';

import type { OdometerEntry, OdometerUnit } from '@/lib/odometer';
import LoadingState from './LoadingState';
import OdometerLogRow from './OdometerLogRow';
import PaginationControls from './PaginationControls';

export type OdometerTableProps = {
  entries: OdometerEntry[];
  isLoading: boolean;
  onCreateEntry: () => void;
  onEditEntry: (entry: OdometerEntry) => void;
  onDeleteEntry: (entry: OdometerEntry) => void;
  deleteDisabled: boolean;
  odometerUnit: OdometerUnit;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function OdometerTable({
  entries,
  isLoading,
  onCreateEntry,
  onEditEntry,
  onDeleteEntry,
  deleteDisabled,
  odometerUnit,
  currentPage,
  totalPages,
  onPageChange,
}: OdometerTableProps) {
  return (
    <section className='rounded-lg border border-base-content/10 bg-base-100 p-6 shadow-sm space-y-4'>
      {isLoading ? (
        <LoadingState message='Loading odometer logs…' />
      ) : entries.length === 0 ? (
        <div className='flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-base-content/60'>
          <span
            className='fa-solid fa-gauge text-4xl text-base-content/20'
            aria-hidden='true'
          />
          <p>No odometer readings logged yet.</p>
          <button
            type='button'
            className='btn btn-sm btn-outline'
            onClick={onCreateEntry}
          >
            <span className='fa-solid fa-plus mr-2' aria-hidden='true' />
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
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </section>
  );
}
