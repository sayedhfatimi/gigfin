import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import ThemeProvider from '@/components/theme/ThemeProvider';
import ThemeToggle from '@/components/theme/ThemeToggle';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GigFin',
  description: 'Income tracking for gig workers',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <div className='relative min-h-screen'>
            <div className='absolute right-4 top-4 z-50'>
              <ThemeToggle />
            </div>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
