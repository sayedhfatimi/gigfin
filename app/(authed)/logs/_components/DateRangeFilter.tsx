'use client';

import { useMemo, useState } from 'react';

export type DateRangePreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'last30days'
  | 'last90days'
  | 'thisYear'
  | 'custom';

export type DateRange = {
  start: Date | null;
  end: Date | null;
  preset: DateRangePreset;
};

const PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'thisWeek', label: 'This week' },
  { value: 'lastWeek', label: 'Last week' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'last90days', label: 'Last 90 days' },
  { value: 'thisYear', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
];

const getPresetDates = (
  preset: DateRangePreset,
): { start: Date | null; end: Date | null } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  switch (preset) {
    case 'all':
      return { start: null, end: null };
    case 'today':
      return { start: today, end: endOfToday };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      return { start: yesterday, end: endOfYesterday };
    }
    case 'last7days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start, end: endOfToday };
    }
    case 'thisWeek': {
      const start = new Date(today);
      const dayOfWeek = start.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is start
      start.setDate(start.getDate() - diff);
      return { start, end: endOfToday };
    }
    case 'lastWeek': {
      const start = new Date(today);
      const dayOfWeek = start.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(start.getDate() - diff - 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: endOfToday };
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'last30days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start, end: endOfToday };
    }
    case 'last90days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 89);
      return { start, end: endOfToday };
    }
    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end: endOfToday };
    }
    case 'custom':
      return { start: null, end: null };
    default:
      return { start: null, end: null };
  }
};

type DateRangeFilterProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
};

const formatDateForInput = (date: Date | null): string => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

export default function DateRangeFilter({
  value,
  onChange,
  className = '',
}: DateRangeFilterProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(value.preset === 'custom');

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setIsCustomOpen(true);
      onChange({ ...value, preset: 'custom' });
    } else {
      setIsCustomOpen(false);
      const { start, end } = getPresetDates(preset);
      onChange({ start, end, preset });
    }
  };

  const handleCustomStartChange = (dateStr: string) => {
    const start = dateStr ? new Date(dateStr) : null;
    onChange({ ...value, start, preset: 'custom' });
  };

  const handleCustomEndChange = (dateStr: string) => {
    const end = dateStr ? new Date(dateStr) : null;
    if (end) {
      end.setHours(23, 59, 59, 999);
    }
    onChange({ ...value, end, preset: 'custom' });
  };

  const selectedLabel = useMemo(() => {
    if (value.preset === 'custom' && value.start && value.end) {
      return `${value.start.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })} - ${value.end.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })}`;
    }
    return (
      PRESET_OPTIONS.find((opt) => opt.value === value.preset)?.label ??
      'All time'
    );
  }, [value]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className='dropdown dropdown-end'>
        <button
          type='button'
          tabIndex={0}
          className='btn btn-sm btn-outline gap-2'
        >
          <span className='fa-regular fa-calendar' aria-hidden='true' />
          {selectedLabel}
          <span
            className='fa-solid fa-chevron-down text-xs'
            aria-hidden='true'
          />
        </button>
        <ul className='dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow-lg border border-base-content/10'>
          {PRESET_OPTIONS.map((option) => (
            <li key={option.value}>
              <button
                type='button'
                className={value.preset === option.value ? 'active' : ''}
                onClick={() => handlePresetChange(option.value)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {isCustomOpen && (
        <div className='flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center'>
          <label className='flex items-center gap-2 text-sm'>
            <span className='text-base-content/60 min-w-10'>From</span>
            <input
              type='date'
              value={formatDateForInput(value.start)}
              onChange={(e) => handleCustomStartChange(e.target.value)}
              className='input input-sm input-bordered flex-1 sm:flex-none'
            />
          </label>
          <label className='flex items-center gap-2 text-sm'>
            <span className='text-base-content/60 min-w-10'>To</span>
            <input
              type='date'
              value={formatDateForInput(value.end)}
              onChange={(e) => handleCustomEndChange(e.target.value)}
              className='input input-sm input-bordered flex-1 sm:flex-none'
            />
          </label>
        </div>
      )}
    </div>
  );
}

export { getPresetDates, PRESET_OPTIONS };
