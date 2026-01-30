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
        : 'text-info';
  const borderColor =
    variant === 'income'
      ? 'border-l-success'
      : variant === 'expense'
        ? 'border-l-error'
        : 'border-l-info';
  const icon =
    variant === 'income'
      ? 'arrow-trend-up'
      : variant === 'expense'
        ? 'arrow-trend-down'
        : 'route';
  const prefix = variant === 'income' ? '+' : variant === 'expense' ? '-' : '';

  return (
    <div
      className={`rounded-lg border border-base-content/10 border-l-4 ${borderColor} bg-base-200 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-base-200/80 space-y-2`}
    >
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <span className={`badge ${badgeVariant} badge-xs gap-1`}>
              <i className={`fa-solid fa-${icon} text-[0.6rem]`} />
            </span>
            <p className='text-sm font-semibold text-base-content'>{label}</p>
          </div>
          <p className='text-xs text-base-content/60'>
            {dateLabel}
            {vehicleLabel ? <> · {vehicleLabel}</> : null}
          </p>
        </div>
        <div className='text-right'>
          <p className={`text-base font-bold ${textColor}`}>
            {prefix}
            {primaryText}
          </p>
          {secondaryText && (
            <p className='text-xs text-base-content/60'>{secondaryText}</p>
          )}
        </div>
      </div>
      <div className='flex flex-row items-center justify-end gap-2 pt-1 border-t border-base-content/5'>
        <EntryActions
          onEdit={onEdit}
          onDelete={onDelete}
          deleteDisabled={deleteDisabled}
        />
      </div>
    </div>
  );
}
