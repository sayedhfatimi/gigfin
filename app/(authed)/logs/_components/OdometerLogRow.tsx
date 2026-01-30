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
    <div className='rounded-lg border border-base-content/10 border-l-4 border-l-info bg-base-200 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-base-200/80 space-y-3'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <span className='badge badge-info badge-xs gap-1'>
              <i className='fa-solid fa-route text-[0.6rem]' />
            </span>
            <p className='text-sm font-semibold text-base-content'>
              {formatDateLabel(entry.date)}
            </p>
          </div>
          <p className='text-xs text-base-content/60'>
            {entry.vehicle?.label ?? 'No vehicle assigned'}
          </p>
        </div>
        <div className='text-right space-y-1'>
          <p className='text-base font-bold text-info'>{distanceText}</p>
          <p className='text-xs text-base-content/60'>
            Start {startText} · End {endText}
          </p>
        </div>
      </div>
      <div className='flex flex-row items-center justify-end gap-2 pt-1 border-t border-base-content/5'>
        <EntryActions
          onEdit={() => onEdit(entry)}
          onDelete={() => onDelete(entry)}
          deleteDisabled={deleteDisabled}
        />
      </div>
    </div>
  );
}
