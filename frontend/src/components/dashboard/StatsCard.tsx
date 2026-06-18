import clsx from 'clsx';
import { Card } from '@/components/ui/Card';

interface StatsCardProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'cyan';
  href?: string;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    text: 'text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-700 dark:text-emerald-300',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-300',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    text: 'text-purple-600 dark:text-purple-400',
    value: 'text-purple-700 dark:text-purple-300',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-600 dark:text-red-400',
    value: 'text-red-700 dark:text-red-300',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950',
    text: 'text-cyan-600 dark:text-cyan-400',
    value: 'text-cyan-700 dark:text-cyan-300',
  },
};

export function StatsCard({ label, value, icon, color = 'blue', href }: StatsCardProps) {
  const c = colorMap[color];

  const content = (
    <Card padding="md" hover={!!href} className={clsx(href && 'cursor-pointer')}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          <p className={clsx('text-2xl font-bold tabular-nums', c.value)}>{value}</p>
        </div>
        {icon && (
          <div className={clsx('p-2.5 rounded-xl', c.bg, c.text)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }

  return content;
}
