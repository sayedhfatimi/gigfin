'use client';

import { useEffect, useRef, useState } from 'react';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search entries...',
  className = '',
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <label
      className={`input input-bordered flex items-center gap-2 ${className}`}
    >
      <span
        className='fa-solid fa-magnifying-glass text-base-content/40'
        aria-hidden='true'
      />
      <input
        ref={inputRef}
        type='text'
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className='grow bg-transparent outline-none'
        aria-label='Search entries'
      />
      {localValue && (
        <button
          type='button'
          onClick={handleClear}
          className='text-base-content/40 hover:text-base-content transition-colors'
          aria-label='Clear search'
        >
          <span className='fa-solid fa-xmark' aria-hidden='true' />
        </button>
      )}
    </label>
  );
}
