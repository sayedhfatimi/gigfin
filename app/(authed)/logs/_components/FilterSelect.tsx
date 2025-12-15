'use client';

import type { ChangeEvent } from 'react';
import FilterRow from './FilterRow';

type FilterSelectOption = {
  value: string;
  label: string;
};

type FilterSelectProps = {
  label: string;
  value: string;
  options: FilterSelectOption[];
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  id?: string;
  disabled?: boolean;
  ariaBusy?: boolean;
  rowClassName?: string;
};

export default function FilterSelect({
  label,
  value,
  options,
  onChange,
  id,
  disabled = false,
  ariaBusy = false,
  rowClassName = '',
}: FilterSelectProps) {
  return (
    <FilterRow label={label} className={rowClassName}>
      <label className='select select-sm'>
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-busy={ariaBusy}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </FilterRow>
  );
}
