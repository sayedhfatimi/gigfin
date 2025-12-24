'use client';

import EntryActions from './EntryActions';

type CombinedTransactionCardProps = {
  label: string;
  dateLabel: string;
  vehicleLabel?: string;
  primaryText: string;
  secondaryText?: string;
  variant: 'income' | 'expense' | 'odometer';
  onEdit: () => void;
  onDelete: () => void;
  deleteDisabled?: boolean;
};

export default function CombinedTransactionCard({
  label,
  dateLabel,
  vehicleLabel,
  primaryText,
  secondaryText,
  variant,
  onEdit,
  onDelete,
  deleteDisabled,
}: CombinedTransactionCardProps) {
  const badgeVariant =
    variant === 'income'
      ? 'badge-success'
      : variant === 'expense'
        ? 'badge-error'
        : 'badge-info';
  const textColor =
    variant === 'income'
      ? 'text-success'
      : variant === 'expense'
        ? 'text-error'
        : 'text-base-content';
  const icon =
    variant === 'income'
      ? 'arrow-right'
      : variant === 'expense'
        ? 'arrow-left'
        : 'route';
  const prefix = variant === 'income' ? '+' : variant === 'expense' ? '-' : '';

  return (
    <div className='border border-base-content/10 bg-base-200 p-4 shadow-sm space-y-2'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <p className='text-sm font-semibold text-base-content'>{label}</p>
          </div>
          <p className='text-xs uppercase text-base-content/60'>
            {dateLabel}
            {vehicleLabel ? <> · {vehicleLabel}</> : null}
          </p>
        </div>
        <div className='text-right'>
          <p className={`text-sm font-semibold ${textColor}`}>
            {prefix}
            {primaryText}
          </p>
          {secondaryText && (
            <p className='text-xs text-base-content/60'>{secondaryText}</p>
          )}
        </div>
      </div>
      <div className='flex flex-row items-center justify-between'>
        <EntryActions
          onEdit={onEdit}
          onDelete={onDelete}
          deleteDisabled={deleteDisabled}
        />
        <span className={`badge ${badgeVariant} badge-sm`}>
          <i className={`fa-solid fa-${icon}`} />
        </span>
      </div>
    </div>
  );
}
