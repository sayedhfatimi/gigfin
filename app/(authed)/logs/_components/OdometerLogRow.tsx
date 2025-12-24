'use client';

import type { OdometerEntry, OdometerUnit } from '@/lib/odometer';
import {
  formatOdometerDistance,
  formatOdometerReading,
  getOdometerDistance,
} from '@/lib/odometer';
import { formatDateLabel } from '../_lib/formatters';
import EntryActions from './EntryActions';

type OdometerLogRowProps = {
  entry: OdometerEntry;
  onEdit: (entry: OdometerEntry) => void;
  onDelete: (entry: OdometerEntry) => void;
  deleteDisabled: boolean;
  odometerUnit: OdometerUnit;
};

export default function OdometerLogRow({
  entry,
  onEdit,
  onDelete,
  deleteDisabled,
  odometerUnit,
}: OdometerLogRowProps) {
  const distance = getOdometerDistance(entry);
  const distanceText = formatOdometerDistance(distance, odometerUnit);
  const startText = formatOdometerReading(entry.startReading, odometerUnit);
  const endText = formatOdometerReading(entry.endReading, odometerUnit);

  return (
    <div className='border border-base-content/10 bg-base-200 p-4 shadow-sm space-y-3'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <p className='text-sm font-semibold text-base-content'>
            {formatDateLabel(entry.date)}
          </p>
          <p className='text-xs uppercase text-base-content/60'>
            {entry.vehicle?.label ?? 'No vehicle assigned'}
          </p>
        </div>
        <div className='text-right space-y-1'>
          <p className='text-sm font-semibold text-base-content'>
            {distanceText}
          </p>
          <p className='text-xs text-base-content/60'>
            Start {startText} · End {endText}
          </p>
        </div>
      </div>
      <div className='flex flex-row items-center justify-between'>
        <EntryActions
          onEdit={() => onEdit(entry)}
          onDelete={() => onDelete(entry)}
          deleteDisabled={deleteDisabled}
        />
        <span className='badge badge-info badge-sm'>
          <i className='fa-solid fa-route' />
        </span>
      </div>
    </div>
  );
}
