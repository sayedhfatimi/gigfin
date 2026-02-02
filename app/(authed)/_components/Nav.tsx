'use client';
import Link from 'next/link';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { useOptionalSidebar } from '@/lib/contexts/SidebarContext';

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'fa-chart-line' },
  { label: 'Logs', href: '/logs', icon: 'fa-table' },
  { label: 'Settings', href: '/settings', icon: 'fa-gear' },
];

type AuthedNavVariant = 'sidebar' | 'mobile';

type AuthedNavProps = {
  variant?: AuthedNavVariant;
  sessionUser: { name?: string | null; email?: string | null } | null;
  isSigningOut: boolean;
  onSignOut: () => Promise<void> | void;
  isActive: (href: string) => boolean;
};

export default function Nav({
  variant = 'sidebar',
  sessionUser,
  isSigningOut,
  onSignOut,
  isActive,
}: AuthedNavProps) {
  // Call hooks at top level before any conditional returns
  const sidebarContext = useOptionalSidebar();
  const isCollapsed = sidebarContext?.isCollapsed ?? false;
  const toggleCollapsed = sidebarContext?.toggleCollapsed;

  const getDockButtonClasses = (active: boolean) =>
    [
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'gap-0.5',
      'px-4',
      'py-2',
      'rounded-xl',
      'transition-all',
      'duration-200',
      'relative',
      active
        ? 'text-primary scale-105'
        : 'text-base-content/60 hover:text-base-content hover:bg-base-200/50 active:scale-95',
    ]
      .filter(Boolean)
      .join(' ');

  if (variant === 'mobile') {
    return (
      <footer className='fixed inset-x-0 bottom-0 z-20 border-t border-base-content/10 bg-base-100/95 backdrop-blur-sm shadow-[0_-4px_20px_-4px] shadow-base-content/10 lg:hidden pb-[env(safe-area-inset-bottom)]'>
        <nav
          role='navigation'
          aria-label='Primary workspace dock'
          className='dock dock-sm items-center justify-around gap-1 px-2 py-1.5'
        >
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={getDockButtonClasses(active)}
              >
                <span
                  aria-hidden='true'
                  className={`fa-solid ${item.icon} text-lg transition-transform duration-200 ${active ? 'scale-110' : ''}`}
                />
                <span
                  className={`text-[0.65rem] font-medium transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-70'}`}
                >
                  {item.label}
                </span>
                {active && (
                  <span className='absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary' />
                )}
              </Link>
            );
          })}
          <div className='dropdown dropdown-top dropdown-end inline-flex'>
            <button
              type='button'
              aria-label='More navigation actions'
              aria-haspopup='menu'
              className={`${getDockButtonClasses(false)} cursor-pointer`}
            >
              <span
                aria-hidden='true'
                className='fa-solid fa-ellipsis text-lg'
              />
              <span className='text-[0.65rem] font-medium opacity-70'>
                More
              </span>
            </button>
            <ul className='dropdown-content menu rounded-2xl mb-2 w-56 gap-1 border border-base-content/10 bg-base-100 p-3 shadow-xl'>
              {/* User info section */}
              <li className='px-2 py-2 border-b border-base-content/10 mb-1'>
                <div className='flex flex-col gap-0.5'>
                  <p className='font-semibold text-sm text-base-content'>
                    {sessionUser?.name ?? sessionUser?.email ?? 'Gig Worker'}
                  </p>
                  {sessionUser?.email && sessionUser?.name && (
                    <p className='truncate text-xs text-base-content/50'>
                      {sessionUser.email}
                    </p>
                  )}
                </div>
              </li>
              {/* Theme toggle */}
              <li>
                <div className='flex items-center justify-between gap-4 px-2 py-2 rounded-lg hover:bg-base-200/50 transition-colors'>
                  <div className='flex items-center gap-2'>
                    <i
                      className='fa-solid fa-moon text-base-content/60 text-sm'
                      aria-hidden='true'
                    />
                    <span className='text-sm text-base-content'>Dark Mode</span>
                  </div>
                  <ThemeToggle variant='toggle' className='toggle-sm' />
                </div>
              </li>
              {/* Sign out */}
              <li className='mt-1 pt-1 border-t border-base-content/10'>
                <button
                  type='button'
                  className='flex items-center gap-2 px-2 py-2 w-full rounded-lg text-error hover:bg-error/10 transition-colors'
                  onClick={onSignOut}
                  disabled={isSigningOut}
                >
                  <i
                    className={`fa-solid ${isSigningOut ? 'fa-spinner fa-spin' : 'fa-arrow-right-from-bracket'} text-sm`}
                    aria-hidden='true'
                  />
                  <span className='text-sm font-medium'>
                    {isSigningOut ? 'Signing out…' : 'Sign Out'}
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </footer>
    );
  }

  // Collapsed sidebar (icon-only mode)
  if (isCollapsed) {
    return (
      <aside className='hidden w-16 flex-col items-center gap-4 border-r border-base-content/10 bg-base-100 py-6 shadow-sm lg:flex lg:sticky lg:top-0 lg:h-screen'>
        {/* Logo */}
        <div className='mb-2'>
          <span className='text-xl font-bold text-primary'>GF</span>
        </div>

        {/* Navigation */}
        <nav className='flex flex-1 flex-col items-center gap-2'>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`btn btn-square btn-ghost tooltip tooltip-right ${
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-base-content/70 hover:bg-base-200'
              }`}
              data-tip={item.label}
            >
              <span
                className={`fa-solid ${item.icon} text-lg`}
                aria-hidden='true'
              />
              <span className='sr-only'>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className='flex flex-col items-center gap-2'>
          <ThemeToggle className='btn-square btn-ghost btn-sm' />
          <button
            type='button'
            aria-label='Sign out'
            className='btn btn-square btn-ghost btn-sm tooltip tooltip-right'
            data-tip='Sign out'
            onClick={onSignOut}
            disabled={isSigningOut}
          >
            <span
              className='fa-solid fa-arrow-right-from-bracket text-base-content/70'
              aria-hidden='true'
            />
          </button>
          {toggleCollapsed && (
            <button
              type='button'
              aria-label='Expand sidebar'
              className='btn btn-square btn-ghost btn-sm tooltip tooltip-right'
              data-tip='Expand'
              onClick={toggleCollapsed}
            >
              <span
                className='fa-solid fa-angles-right text-base-content/70'
                aria-hidden='true'
              />
            </button>
          )}
        </div>
      </aside>
    );
  }

  // Expanded sidebar (default)
  return (
    <aside className='hidden w-72 flex-col gap-6 border-r border-base-content/10 bg-base-100 p-6 py-10 shadow-sm lg:flex lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto bottom-0'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-xs font-semibold uppercase text-base-content/60'>
            GigFin
          </p>
          <p className='text-2xl font-semibold text-base-content'>Workspace</p>
        </div>
        {toggleCollapsed && (
          <button
            type='button'
            aria-label='Collapse sidebar'
            className='btn btn-square btn-ghost btn-sm'
            onClick={toggleCollapsed}
          >
            <span
              className='fa-solid fa-angles-left text-base-content/70'
              aria-hidden='true'
            />
          </button>
        )}
      </div>
      <div className='space-y-1 text-sm text-base-content/70'>
        <p className='font-semibold text-base-content'>
          {sessionUser?.name ?? sessionUser?.email ?? 'Gig Worker'}
        </p>
        <p className='text-xs'>{sessionUser?.email}</p>
      </div>
      <nav className='flex flex-1 flex-col gap-2'>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`btn btn-ghost justify-start gap-3 text-sm font-semibold transition ${
              isActive(item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-base-content/80 hover:bg-base-200'
            }`}
          >
            <span className={`fa-solid ${item.icon} text-base-content/70`} />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className='flex flex-col gap-3'>
        <div className='flex flex-row items-center justify-between'>
          <div className='text-xs'>Sign Out</div>
          <button
            type='button'
            aria-label='Sign out'
            className='btn btn-square btn-sm'
            onClick={onSignOut}
            disabled={isSigningOut}
          >
            <span
              aria-hidden='true'
              className='fa-solid fa-arrow-right-from-bracket text-base-content/70'
            />
            <span className='sr-only'>Sign out</span>
          </button>
        </div>
        <div className='flex flex-row items-center justify-between'>
          <div className='text-xs'>Dark Mode</div>
          <ThemeToggle className='btn-square' />
        </div>
      </div>
    </aside>
  );
}
