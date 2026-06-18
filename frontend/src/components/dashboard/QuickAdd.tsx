import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import type { ItemType } from '@/types';

const quickAddItems: { type: ItemType; label: string; icon: string; color: string }[] = [
  { type: 'task', label: 'New Task', icon: '☑', color: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900' },
  { type: 'task-it-infra', label: 'IT Infra', icon: '⚙', color: 'bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900' },
  { type: 'reading-book', label: 'Book to Read', icon: '📚', color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900' },
  { type: 'reading-website', label: 'Website', icon: '🌐', color: 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900' },
  { type: 'buying', label: 'To Buy', icon: '🛒', color: 'bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900' },
  { type: 'trip', label: 'Trip Plan', icon: '✈', color: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900' },
];

export function QuickAdd() {
  const navigate = useNavigate();

  return (
    <Card padding="md">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick Add</h3>
      <div className="grid grid-cols-3 gap-2">
        {quickAddItems.map((item) => (
          <button
            key={item.type}
            onClick={() => navigate(`/items/new?type=${item.type}`)}
            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl text-xs font-medium transition-colors duration-150 ${item.color}`}
          >
            <span className="text-xl" role="img" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
