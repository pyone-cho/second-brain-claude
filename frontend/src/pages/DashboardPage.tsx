import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchStats } from '@/api/mock';
import { useItems } from '@/hooks/useItems';
import type { AppStats } from '@/types';
import { TYPE_SHORT_LABELS } from '@/constants';
import { getItemTitle } from '@/utils/item';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { QuickAdd } from '@/components/dashboard/QuickAdd';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';

export function DashboardPage() {
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your second brain at a glance</p>
      </div>

      {statsError && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
          {statsError}
        </div>
      )}

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
            <Link to="/todo">
              <StatsCard
                label="To Do"
                value={stats.totalTodo}
                color="amber"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
            </Link>
            <Link to="/process">
              <StatsCard
                label="In Process"
                value={stats.totalProcess}
                color="blue"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
            </Link>
            <Link to="/memo">
              <StatsCard
                label="Archived"
                value={stats.totalMemo}
                color="green"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                }
              />
            </Link>
            <StatsCard
              label="Books to Read"
              value={stats.booksToRead}
              color="purple"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Recent Activity
              </h2>
              <Link to="/memo" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                View all
              </Link>
            </div>

            {recent.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                No archived items yet. Complete your first item to see it here.
              </p>
            ) : (
              <div className="space-y-1">
                {recent.map((item) => (
                    <Link
                      key={item.id}
                      to={`/items/${item.id}/edit`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Badge variant={item.type} size="sm">{TYPE_SHORT_LABELS[item.type] || item.type}</Badge>
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{getItemTitle(item)}</span>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                        {format(new Date(item.updatedAt), 'MMM d')}
                      </span>
                    </Link>
                  ))}
              </div>
            )}
          </Card>

          {stats && (
            <Card padding="md">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Breakdown by Type
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { type: 'task' as const, label: 'Tasks' },
                  { type: 'task-it-infra' as const, label: 'IT Infra' },
                  { type: 'reading-book' as const, label: 'Books' },
                  { type: 'reading-website' as const, label: 'Websites' },
                  { type: 'buying' as const, label: 'Shopping' },
                  { type: 'trip' as const, label: 'Trips' },
                ].map(({ type, label }) => (
                  <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <Badge variant={type} size="sm">{label}</Badge>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                      {stats.byType[type] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <QuickAdd />
          {stats && (
            <Card padding="md">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Status</h3>
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
      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3 tabular-nums">
        {t} items total
      </p>
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
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`font-medium ${textColor}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}
