import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchStats } from '@/api/mock';
import { useItems } from '@/hooks/useItems';
import { useAuth } from '@/hooks/useAuth';
import type { AppStats } from '@/types';
import { TYPE_SHORT_LABELS } from '@/constants';
import { getItemTitle } from '@/utils/item';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { QuickAdd } from '@/components/dashboard/QuickAdd';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AppStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const { items: recentItems } = useItems('memo');

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    setStatsError(null);

    fetchStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setStatsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStatsError(err instanceof Error ? err.message : 'Failed to load stats');
          setStatsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const recent = recentItems.slice(0, 5);
  const today = new Date();

  return (
    <div className="space-y-8">
      {/* Header with greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {getGreeting()}{user?.name ? <>, <span className="text-brand-600 dark:text-brand-400">{user.name}</span></> : <span className="text-brand-600 dark:text-brand-400">.</span>}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {format(today, 'EEEE, MMMM d, yyyy')} &mdash; Your second brain at a glance
          </p>
        </div>
        <Link
          to="/items/new"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Item
        </Link>
      </div>

      {statsError && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
          {statsError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} padding="md">
                <div className="animate-pulse space-y-2">
                  <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-7 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </Card>
            ))}
          </>
        ) : stats ? (
          <>
            <div className="animate-stagger-1">
              <StatsCard
                label="To Do"
                value={stats.totalTodo}
                color="amber"
                href="/todo"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
              />
            </div>
            <div className="animate-stagger-2">
              <StatsCard
                label="In Process"
                value={stats.totalProcess}
                color="blue"
                href="/process"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                }
              />
            </div>
            <div className="animate-stagger-3">
              <StatsCard
                label="Archived"
                value={stats.totalMemo}
                color="green"
                href="/memo"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                }
              />
            </div>
            <div className="animate-stagger-4">
              <StatsCard
                label="Books to Read"
                value={stats.booksToRead}
                color="purple"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
              />
            </div>
          </>
        ) : null}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Activity
              </h2>
              <Link to="/memo" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                View all &rarr;
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m16.5 0V7.5m-16.5 0h16.5" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  No archived items yet
                </p>
                <Link
                  to="/todo"
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Start by adding items to your todo list &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {recent.map((item, index) => (
                  <Link
                    key={item.id}
                    to={`/items/${item.id}/edit`}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-150 group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant={item.type} size="sm" dot>{TYPE_SHORT_LABELS[item.type] || item.type}</Badge>
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                        {getItemTitle(item)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 ml-4">
                      {formatRelativeDate(item.updatedAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Breakdown by Type */}
          {stats && (
            <Card padding="md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                  Breakdown by Type
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { type: 'task' as const, label: 'Tasks' },
                  { type: 'task-it-infra' as const, label: 'IT Infra' },
                  { type: 'reading-book' as const, label: 'Books' },
                  { type: 'reading-website' as const, label: 'Websites' },
                  { type: 'buying' as const, label: 'Shopping' },
                  { type: 'trip' as const, label: 'Trips' },
                ].map(({ type, label }) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150"
                  >
                    <Badge variant={type} size="sm">{label}</Badge>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                      {stats.byType[type] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column — Quick Add + Status */}
        <div className="space-y-4">
          <QuickAdd />

          {stats && (
            <Card padding="md">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</h3>
              </div>
              <StatusBars stats={stats} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function computeTotal(s: AppStats): number {
  return s.totalTodo + s.totalProcess + s.totalMemo;
}

function StatusBars({ stats }: { stats: AppStats }) {
  const t = computeTotal(stats);

  return (
    <div className="space-y-3">
      <StatusBar
        label="Todo"
        value={stats.totalTodo}
        total={t}
        color="bg-amber-400"
        textColor="text-amber-600 dark:text-amber-400"
      />
      <StatusBar
        label="In Process"
        value={stats.totalProcess}
        total={t}
        color="bg-blue-400"
        textColor="text-blue-600 dark:text-blue-400"
      />
      <StatusBar
        label="Archived"
        value={stats.totalMemo}
        total={t}
        color="bg-emerald-400"
        textColor="text-emerald-600 dark:text-emerald-400"
      />
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 tabular-nums">
          {t} items total
        </p>
      </div>
    </div>
  );
}

function StatusBar({
  label,
  value,
  total,
  color,
  textColor,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  textColor: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold tabular-nums ${textColor}`}>{value}</span>
          <span className="text-slate-400 dark:text-slate-600">({Math.round(percentage)}%)</span>
        </div>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
