import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';

interface StatsCardProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'cyan';
  href?: string;
  className?: string;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    text: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
    ring: 'hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-700',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-700 dark:text-emerald-300',
    ring: 'hover:ring-2 hover:ring-emerald-300 dark:hover:ring-emerald-700',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-300',
    ring: 'hover:ring-2 hover:ring-amber-300 dark:hover:ring-amber-700',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    text: 'text-purple-600 dark:text-purple-400',
    value: 'text-purple-700 dark:text-purple-300',
    ring: 'hover:ring-2 hover:ring-purple-300 dark:hover:ring-purple-700',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/50',
    text: 'text-red-600 dark:text-red-400',
    value: 'text-red-700 dark:text-red-300',
    ring: 'hover:ring-2 hover:ring-red-300 dark:hover:ring-red-700',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/50',
    text: 'text-cyan-600 dark:text-cyan-400',
    value: 'text-cyan-700 dark:text-cyan-300',
    ring: 'hover:ring-2 hover:ring-cyan-300 dark:hover:ring-cyan-700',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/40',
  },
};

function useCountUp(end: number, duration = 600) {
  const [count, setCount] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }

    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));

      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };

    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [end, duration]);

  return count;
}

export function StatsCard({ label, value, icon, color = 'blue', href, className }: StatsCardProps) {
  const c = colorMap[color];
  const displayValue = useCountUp(value);

  const content = (
    <Card
      padding="md"
      hover={!!href}
      className={clsx(
        'transition-all duration-200',
        href && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        c.ring,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          <p className={clsx('text-2xl font-bold tabular-nums animate-count-up', c.value)}>
            {displayValue}
          </p>
        </div>
        {icon && (
          <div className={clsx('p-2.5 rounded-xl transition-colors duration-200', c.iconBg, c.text)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}
