'use client';
import Link from 'next/link';
import ThemeToggle from '@/components/theme/ThemeToggle';

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'fa-chart-line' },
  { label: 'Logs', href: '/logs', icon: 'fa-table' },
  { label: 'Account', href: '/account', icon: 'fa-user' },
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
  const getDockButtonClasses = (active: boolean) =>
    [
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'gap-1',
      'rounded-2xl',
      'border',
      'px-2',
      'py-2',
      'text-[0.65rem]',
      'font-semibold',
      'tracking-wide',
      'transition-colors',
      'focus-visible:outline',
      'focus-visible:outline-2',
      'focus-visible:outline-offset-2',
      'focus-visible:outline-primary/50',
      active
        ? 'border-primary/50 bg-primary/10 text-primary'
        : 'border-transparent text-base-content/70 hover:border-base-content/30 hover:bg-base-200',
    ]
      .filter(Boolean)
      .join(' ');

  if (variant === 'mobile') {
    return (
      <footer className='fixed inset-x-0 bottom-0 z-20 border-t border-base-content/10 bg-base-100/95 shadow-[0_-20px_30px_-10px] shadow-base-content/30 lg:hidden'>
        <nav
          aria-label='Primary workspace dock'
          className='dock dock-sm items-center gap-2 px-3 py-2'
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
                  className={`fa-solid ${item.icon} text-lg`}
                />
                <span className='dock-label'>{item.label}</span>
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
              <span className='dock-label'>More</span>
            </button>
            <ul className='dropdown-content menu rounded-box mt-2 w-52 gap-2 border border-base-content/10 bg-base-100 p-2 shadow-lg'>
              <li className='px-3 text-xs text-base-content/70'>
                <p className='font-semibold text-base-content'>
                  {sessionUser?.name ?? sessionUser?.email ?? 'Gig Worker'}
                </p>
                {sessionUser?.email && (
                  <p className='truncate text-[0.65rem] text-base-content/60'>
                    {sessionUser.email}
                  </p>
                )}
              </li>
              <li className='pt-2'>
                <div className='flex items-center justify-between gap-4 px-2'>
                  <span className='text-xs font-semibold text-base-content'>
                    Sign Out
                  </span>
                  <button
                    type='button'
                    className='btn btn-square btn-sm text-sm btn-error'
                    onClick={onSignOut}
                    disabled={isSigningOut}
                  >
                    <span
                      aria-hidden='true'
                      className='fa-solid fa-arrow-right-from-bracket'
                    />
                  </button>
                </div>
              </li>
              <li className='pt-2'>
                <div className='flex items-center justify-between gap-4 px-2'>
                  <span className='text-xs font-semibold text-base-content'>
                    Dark Mode
                  </span>
                  <ThemeToggle variant='toggle' className='toggle-sm' />
                </div>
              </li>
            </ul>
          </div>
        </nav>
      </footer>
    );
  }

  return (
    <aside className='hidden w-72 flex-col gap-6 border-r border-base-content/10 bg-base-100 p-6 py-10 shadow-sm lg:flex lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto bottom-0'>
      <div>
        <p className='text-xs font-semibold uppercase text-base-content/60'>
          GigFin
        </p>
        <p className='text-2xl font-semibold text-base-content'>Workspace</p>
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
