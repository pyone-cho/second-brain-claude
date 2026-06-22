import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import clsx from 'clsx';

export function Header() {
  const { theme, setTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const cycleTheme = () => {
    const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    setTheme(next);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!menuOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  const handleSignOut = useCallback(() => {
    logout();
    setMenuOpen(false);
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const initials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-semibold text-lg text-slate-900 dark:text-slate-100 hover:opacity-80 transition-opacity shrink-0"
        >
          <svg className="w-7 h-7 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          <span className="hidden sm:inline">Second Brain</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1" aria-label="Main navigation">
          <NavLink to="/" current={location.pathname}>
            Dashboard
          </NavLink>
          <NavLink to="/todo" current={location.pathname}>
            Todo
          </NavLink>
          <NavLink to="/process" current={location.pathname}>
            Process
          </NavLink>
          <NavLink to="/memo" current={location.pathname}>
            Memo
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/items/new"
            className={clsx(
              'inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg',
              'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
              'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950',
              'shadow-sm'
            )}
          >
            <svg className="w-4 h-4 sm:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New</span>
          </Link>

          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label={`Current theme: ${theme}. Click to switch.`}
            title={`Theme: ${theme}`}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* User menu */}
          {user && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className={clsx(
                  'flex items-center gap-2 p-1.5 rounded-lg transition-colors',
                  'hover:bg-slate-100 dark:hover:bg-slate-800',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950'
                )}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <span
                  className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold shrink-0"
                  aria-hidden="true"
                >
                  {initials}
                </span>
                <span className="hidden md:inline text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                  {user.name}
                </span>
                <svg
                  className={clsx(
                    'w-3.5 h-3.5 text-slate-400 transition-transform duration-150',
                    menuOpen && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div
                  className={clsx(
                    'absolute right-0 mt-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg',
                    'animate-scale-in origin-top-right',
                    'z-50'
                  )}
                  role="menu"
                  aria-orientation="vertical"
                >
                  {/* User info */}
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>

                  <div className="h-px bg-slate-200 dark:bg-slate-700" />

                  {/* Sign out */}
                  <div className="p-1.5">
                    <button
                      onClick={handleSignOut}
                      className={clsx(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg',
                        'text-slate-600 dark:text-slate-300',
                        'hover:bg-slate-100 dark:hover:bg-slate-800',
                        'transition-colors duration-150',
                        'focus:outline-none focus:ring-2 focus:ring-brand-500'
                      )}
                      role="menuitem"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, current, children }: { to: string; current: string; children: React.ReactNode }) {
  const isActive = to === '/'
    ? current === '/'
    : current.startsWith(to);

  return (
    <Link
      to={to}
      className={clsx(
        'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150',
        isActive
          ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
      )}
    >
      {children}
    </Link>
  );
}

function SunIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}
