import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';
import type { AnyItem, ITInfraItem } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

interface ITInfraTableProps {
  items: ITInfraItem[];
  onTogglePin?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

type SortField = 'item' | 'infra' | 'kind' | 'url_ip' | 'updatedAt';
type SortDir = 'asc' | 'desc';

const infraLabels: Record<string, string> = {
  server: 'Server',
  network: 'Network',
  cloud: 'Cloud',
};

export function ITInfraTable({ items, onTogglePin, onEdit, onDelete }: ITInfraTableProps) {
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      const am = a.processMemo;
      const bm = b.processMemo;
      switch (sortField) {
        case 'item':
          cmp = (am.item || '').localeCompare(bm.item || '');
          break;
        case 'infra':
          cmp = (am.infra || '').localeCompare(bm.infra || '');
          break;
        case 'kind':
          cmp = (am.kind || '').localeCompare(bm.kind || '');
          break;
        case 'url_ip':
          cmp = (am.url_ip || '').localeCompare(bm.url_ip || '');
          break;
        case 'updatedAt':
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return arr;
  }, [items, sortField, sortDir]);

  if (items.length === 0) {
    return (
      <EmptyState
        title="No IT infrastructure items"
        description="IT infrastructure items will appear here when you create them."
      />
    );
  }

  const SortHeader = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <th
      className={clsx(
        'px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none transition-colors',
        className
      )}
      onClick={() => handleSort(field)}
    >
      <div className="inline-flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-brand-500">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
        )}
      </div>
    </th>
  );

  const selectedItem = selectedId ? items.find((i) => i.id === selectedId) : null;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <SortHeader field="item">Item</SortHeader>
              <SortHeader field="infra">Infra</SortHeader>
              <SortHeader field="kind">Kind</SortHeader>
              <SortHeader field="url_ip">URL / IP</SortHeader>
              <SortHeader field="updatedAt">Date</SortHeader>
              <th className="px-4 py-3 w-0" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sorted.map((item) => {
              const pm = item.processMemo;
              const isSelected = selectedId === item.id;

              return (
                <tr
                  key={item.id}
                  className={clsx(
                    'group transition-colors',
                    'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer',
                    isSelected && 'bg-brand-50/50 dark:bg-brand-900/10',
                    item.pinned && 'bg-amber-50/50 dark:bg-amber-900/10'
                  )}
                  onClick={() => setSelectedId(isSelected ? null : item.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.pinned && (
                        <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                        </svg>
                      )}
                      <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                        {pm.item || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant={pm.infra} size="sm">
                      {infraLabels[pm.infra] || pm.infra || '—'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {pm.kind || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {pm.url_ip ? (
                      /^https?:\/\//i.test(pm.url_ip) ? (
                        <a
                          href={pm.url_ip}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 dark:text-brand-400 hover:underline text-xs font-mono"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {pm.url_ip.length > 40 ? pm.url_ip.slice(0, 40) + '...' : pm.url_ip}
                        </a>
                      ) : (
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                          {pm.url_ip}
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                    {format(new Date(item.updatedAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onTogglePin && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onTogglePin(item.id); }}
                          className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-amber-500 transition-colors"
                          aria-label={item.pinned ? 'Unpin' : 'Pin'}
                        >
                          <svg className="w-3.5 h-3.5" fill={item.pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                          </svg>
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
                          className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-brand-500 transition-colors"
                          aria-label="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                          className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
                          aria-label="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

      {selectedItem && (
        <ITInfraDetail item={selectedItem} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

function ITInfraDetail({ item, onClose }: { item: ITInfraItem; onClose: () => void }) {
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const toggleReveal = (field: string) => {
    setRevealedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch { /* not available */ }
  };

  const pm = item.processMemo;
  const fields: { label: string; key: string; value: string; secret?: boolean }[] = [
    { label: 'Infra', key: 'infra', value: pm.infra },
    { label: 'Item', key: 'item', value: pm.item },
    { label: 'Kind', key: 'kind', value: pm.kind },
    { label: 'Description', key: 'description', value: pm.description },
    { label: 'URL / IP', key: 'url_ip', value: pm.url_ip },
    { label: 'Username', key: 'username', value: pm.username },
    { label: 'Password', key: 'password', value: pm.password, secret: true },
    { label: 'New Password', key: 'new_password', value: pm.new_password, secret: true },
    { label: 'Remark', key: 'remark', value: pm.remark },
  ];

  return (
    <div className="card-surface p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {pm.item || 'IT Infra Detail'}
        </h3>
        <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {fields.map((f) => {
          if (!f.value) return null;
          return (
            <div key={f.key} className={clsx(f.key === 'description' && 'sm:col-span-2')}>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{f.label}</dt>
              <dd className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                {f.secret ? (
                  <>
                    <span className="font-mono">
                      {revealedFields.has(f.key) ? f.value : '······'}
                    </span>
                    <button
                      onClick={() => toggleReveal(f.key)}
                      className="text-xs text-brand-500 hover:text-brand-600 transition-colors"
                    >
                      {revealedFields.has(f.key) ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(f.value, f.key)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {copiedField === f.key ? 'Copied!' : 'Copy'}
                    </button>
                  </>
                ) : (
                  <span>{f.value}</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
