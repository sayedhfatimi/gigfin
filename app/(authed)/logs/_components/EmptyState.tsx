'use client';

type EmptyStateProps = {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

export default function EmptyState({
  icon = 'fa-inbox',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <div className='flex min-h-60 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-base-content/10 bg-base-100/50 p-8 text-center'>
      <div className='flex h-16 w-16 items-center justify-center rounded-full bg-base-200'>
        <span
          className={`fa-solid ${icon} text-2xl text-base-content/40`}
          aria-hidden='true'
        />
      </div>
      <div className='space-y-2'>
        <h3 className='text-lg font-semibold text-base-content'>{title}</h3>
        <p className='max-w-sm text-sm text-base-content/60'>{description}</p>
      </div>
      {(actionLabel || secondaryActionLabel) && (
        <div className='flex flex-wrap items-center justify-center gap-3'>
          {actionLabel && onAction && (
            <button
              type='button'
              className='btn btn-primary btn-sm'
              onClick={onAction}
            >
              <span className='fa-solid fa-plus mr-2' aria-hidden='true' />
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type='button'
              className='btn btn-ghost btn-sm'
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type EmptyStateVariant =
  | 'no-income'
  | 'no-expenses'
  | 'no-odometer'
  | 'no-results'
  | 'no-transactions';

type ContextualEmptyStateProps = {
  variant: EmptyStateVariant;
  onAddIncome?: () => void;
  onAddExpense?: () => void;
  onAddOdometer?: () => void;
  onClearFilters?: () => void;
};

const EMPTY_STATE_CONFIG: Record<
  EmptyStateVariant,
  {
    icon: string;
    title: string;
    description: string;
  }
> = {
  'no-income': {
    icon: 'fa-wallet',
    title: 'No income logged yet',
    description:
      'Start tracking your gig earnings. Add your first delivery, ride, or shift to see your income grow.',
  },
  'no-expenses': {
    icon: 'fa-receipt',
    title: 'No expenses recorded',
    description:
      'Track fuel, maintenance, phone bills, and other business costs to understand your true profit margins.',
  },
  'no-odometer': {
    icon: 'fa-gauge-high',
    title: 'No odometer readings',
    description:
      'Log your mileage to track driving patterns and claim tax deductions on business miles.',
  },
  'no-results': {
    icon: 'fa-filter-circle-xmark',
    title: 'No matching entries',
    description:
      "Try adjusting your search or filters to find what you're looking for.",
  },
  'no-transactions': {
    icon: 'fa-clipboard-list',
    title: 'No transactions yet',
    description:
      'This is where all your income, expenses, and mileage will appear. Start by adding your first entry.',
  },
};

export function ContextualEmptyState({
  variant,
  onAddIncome,
  onAddExpense,
  onAddOdometer,
  onClearFilters,
}: ContextualEmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[variant];

  const getActions = (): {
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
  } => {
    switch (variant) {
      case 'no-income':
        return {
          actionLabel: 'Add first income',
          onAction: onAddIncome,
        };
      case 'no-expenses':
        return {
          actionLabel: 'Add first expense',
          onAction: onAddExpense,
        };
      case 'no-odometer':
        return {
          actionLabel: 'Add odometer reading',
          onAction: onAddOdometer,
        };
      case 'no-results':
        return {
          actionLabel: 'Clear filters',
          onAction: onClearFilters,
        };
      case 'no-transactions':
        return {
          actionLabel: 'Add income',
          onAction: onAddIncome,
          secondaryActionLabel: 'Add expense',
          onSecondaryAction: onAddExpense,
        };
      default:
        return {};
    }
  };

  const actions = getActions();

  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
      {...actions}
    />
  );
}
