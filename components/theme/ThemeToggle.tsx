'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { darkTheme, lightTheme } from './ThemeProvider';

const themeLabel = {
  [lightTheme]: 'Nord',
  [darkTheme]: 'Dim',
} as const;

export default function ThemeToggle() {
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

  return (
    <button
      type='button'
      className='btn btn-ghost btn-square'
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
