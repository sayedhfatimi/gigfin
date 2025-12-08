'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export const lightTheme = 'nord';
export const darkTheme = 'dim';

const availableThemes = [lightTheme, darkTheme] as const;

export default function ThemeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextThemesProvider
      attribute='data-theme'
      defaultTheme={lightTheme}
      themes={[...availableThemes]}
    >
      {children}
    </NextThemesProvider>
  );
}
