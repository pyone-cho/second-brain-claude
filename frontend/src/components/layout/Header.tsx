import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import clsx from 'clsx';

export function Header() {
  const { theme, setTheme, isDark } = useTheme();
  const location = useLocation();

  const cycleTheme = () => {
    const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    setTheme(next);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-semibold text-lg text-slate-900 dark:text-slate-100 hover:opacity-80 transition-opacity shrink-0"
        >
          <span className="text-2xl" role="img" aria-hidden="true">
            🧠
          </span>
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
