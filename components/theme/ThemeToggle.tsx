'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { darkTheme, lightTheme } from './ThemeProvider';

const themeLabel = {
  [lightTheme]: 'Nord',
  [darkTheme]: 'Dim',
} as const;

type ThemeToggleProps = {
  className?: string;
  variant?: 'button' | 'toggle';
};

export default function ThemeToggle({
  className = '',
  variant = 'button',
}: ThemeToggleProps) {
  const { resolvedTheme, theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const activeTheme = resolvedTheme ?? theme ?? lightTheme;
  const isDark = activeTheme === darkTheme;
  const nextTheme = isDark ? lightTheme : darkTheme;

  const buttonClasses = ['btn', 'btn-sm', className].filter(Boolean).join(' ');
  const toggleClasses = ['toggle', 'toggle-sm', className]
    .filter(Boolean)
    .join(' ');

  if (variant === 'toggle') {
    return (
      <input
        type='checkbox'
        className={toggleClasses}
        checked={isDark}
        onChange={() => setTheme(nextTheme)}
        aria-label={`Switch to ${themeLabel[nextTheme]} theme`}
      />
    );
  }

  return (
    <button
      type='button'
      className={buttonClasses}
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${themeLabel[nextTheme]} theme`}
      aria-pressed={isDark}
    >
      <span
        aria-hidden='true'
        className={`fa-solid ${isDark ? 'fa-moon' : 'fa-sun'}`}
      />
      <span className='sr-only'>Switch to {themeLabel[nextTheme]} theme</span>
    </button>
  );
}
