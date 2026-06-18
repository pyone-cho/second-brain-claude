import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';
import type { AnyItem } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface MemoTableProps {
  items: AnyItem[];
  onTogglePin?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

type SortField = 'updatedAt' | 'type' | 'title';
type SortDir = 'asc' | 'desc';

const typeLabels: Record<string, string> = {
  task: 'Task',
  'task-it-infra': 'IT Infra',
  'reading-book': 'Book',
  'reading-website': 'Website',
  buying: 'Buy',
  trip: 'Trip',
};

function getItemTitle(item: AnyItem): string {
  const todo = (item as any).todo;
  if (!todo) return item.id;
  switch (item.type) {
    case 'task':
    case 'task-it-infra':
      return todo.name || 'Untitled';
    case 'reading-book':
      return todo.title || 'Untitled';
    case 'reading-website':
      return todo.title || 'Untitled';
    case 'buying':
      return todo.category || 'Purchase';
    case 'trip':
      return todo.destination || 'Untitled';
    default:
      return 'Untitled';
  }
}

export function MemoTable({ items, onTogglePin, onDelete, onEdit }: MemoTableProps) {
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'updatedAt':
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'type':
          cmp = a.type.localeCompare(b.type);
          break;
        case 'title':
          cmp = getItemTitle(a).localeCompare(getItemTitle(b));
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return arr;
  }, [items, sortField, sortDir]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <EmptyState
        title="No memo items found"
        description="Complete items from your Process list to build your knowledge archive."
      />
    );
  }

  const SortHeader = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <th
      className={clsx(
        'px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none transition-colors',
        className
      )}
      onClick={() => handleSort(field)}
    >
      <div className="inline-flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-brand-500">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
        )}
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <SortHeader field="title" label="Title" className="w-full" />
            <SortHeader field="type" label="Type" />
            <SortHeader field="updatedAt" label="Date" />
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {sorted.map((item) => {
            const isExpanded = expandedRows.has(item.id);
            const title = getItemTitle(item);

            return (
              <tr
                key={item.id}
                className={clsx(
                  'group transition-colors',
                  'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                  item.pinned && 'bg-amber-50/50 dark:bg-amber-900/10'
                )}
              >
                <td className="px-4 py-3">
                  <button
                    className="text-left w-full flex items-center gap-2 min-w-0"
                    onClick={() => toggleRow(item.id)}
                  >
                    {item.pinned && (
                      <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                      </svg>
                    )}
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{title}</span>
                    <svg
                      className={clsx(
                        'w-4 h-4 text-slate-400 shrink-0 transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <MemoExpandedRow item={item} />
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={item.type} size="sm">{typeLabels[item.type] || item.type}</Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                  {format(new Date(item.updatedAt), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onTogglePin && (
                      <button
                        onClick={() => onTogglePin(item.id)}
                        className="p-1.5 rounded-md text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                        aria-label={item.pinned ? 'Unpin' : 'Pin'}
                      >
                        <svg className="w-4 h-4" fill={item.pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                        </svg>
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item.id)}
                        className="p-1.5 rounded-md text-slate-300 dark:text-slate-600 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                        aria-label="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 rounded-md text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        aria-label="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MemoExpandedRow({ item }: { item: AnyItem }) {
  const pm = (item as any).processMemo;
  if (!pm) return <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">No details.</p>;

  switch (item.type) {
    case 'task':
      return (
        <div className="mt-3 pl-6 space-y-1.5 pb-2">
          {pm.problem && <DetailLine label="Problem" value={pm.problem} />}
          {pm.experience && <DetailLine label="Experience" value={pm.experience} />}
          {pm.note && <DetailLine label="Note" value={pm.note} />}
        </div>
      );
    case 'task-it-infra':
      return (
        <div className="mt-3 pl-6 space-y-1.5 pb-2">
          {pm.infra && <DetailLine label="Infra" value={pm.infra} />}
          {pm.item && <DetailLine label="Item" value={pm.item} />}
          {pm.url_ip && <DetailLine label="URL/IP" value={pm.url_ip} />}
          {pm.username && <DetailLine label="Username" value={pm.username} />}
          {pm.remark && <DetailLine label="Remark" value={pm.remark} />}
        </div>
      );
    case 'reading-book':
      return (
        <div className="mt-3 pl-6 space-y-1.5 pb-2">
          {pm.knowledge && <DetailLine label="Knowledge" value={pm.knowledge} />}
          {pm.note && <DetailLine label="Notes" value={pm.note} />}
        </div>
      );
    case 'reading-website':
      return (
        <div className="mt-3 pl-6 space-y-1.5 pb-2">
          {pm.knowledge && <DetailLine label="Knowledge" value={pm.knowledge} />}
          {pm.note && <DetailLine label="Notes" value={pm.note} />}
        </div>
      );
    default:
      return null;
  }
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-xs">
      <span className="font-medium text-slate-500 dark:text-slate-400">{label}: </span>
      <span className="text-slate-600 dark:text-slate-400">{value}</span>
    </p>
  );
}
