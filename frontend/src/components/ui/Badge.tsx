import clsx from 'clsx';
import type { Priority, ItemType, ItemStatus, InfraType } from '@/types';

type BadgeVariant = 'default' | Priority | ItemType | ItemStatus | InfraType | 'active';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variantMap: Record<string, string> = {
  default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  low: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  medium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  high: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  urgent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',

  task: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  'task-it-infra': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  'reading-book': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  'reading-website': 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
  buying: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  trip: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',

  todo: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  process: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  memo: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',

  server: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  network: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  cloud: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',

  active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
};

const dotColorMap: Record<string, string> = {
  default: 'bg-slate-400',
  low: 'bg-slate-400',
  medium: 'bg-blue-400',
  high: 'bg-amber-400',
  urgent: 'bg-red-400',
  task: 'bg-purple-400',
  'task-it-infra': 'bg-cyan-400',
  'reading-book': 'bg-emerald-400',
  'reading-website': 'bg-teal-400',
  buying: 'bg-pink-400',
  trip: 'bg-indigo-400',
  todo: 'bg-amber-400',
  process: 'bg-blue-400',
  memo: 'bg-green-400',
  server: 'bg-slate-400',
  network: 'bg-orange-400',
  cloud: 'bg-sky-400',
  active: 'bg-emerald-400',
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
};

export function Badge({ variant = 'default', children, className, size = 'md', dot = false }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap',
        sizeStyles[size],
        variantMap[variant] || variantMap.default,
        className
      )}
    >
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full', dotColorMap[variant] || dotColorMap.default)} />
      )}
      {children}
    </span>
  );
}
