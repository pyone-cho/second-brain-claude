import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import clsx from 'clsx';
import type { AnyItem, ItemStatus } from '@/types';
import { TYPE_LABELS } from '@/constants';
import { getItemTitle, getItemSubtitle } from '@/utils/item';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface ItemCardProps {
  item: AnyItem;
  onMoveStatus?: (id: string, newStatus: ItemStatus) => void;
  onDelete?: (id: string) => void;
  onTogglePin?: (id: string) => void;
}

export function ItemCard({ item, onMoveStatus, onDelete, onTogglePin }: ItemCardProps) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = useCallback(() => {
    onDelete?.(item.id);
    setConfirmDelete(false);
  }, [item.id, onDelete]);

  const title = getItemTitle(item);
  const subtitle = getItemSubtitle(item);

  return (
    <>
      <Card
        hover
        padding="md"
        className={clsx(
          'cursor-pointer group',
          item.pinned && 'ring-1 ring-amber-300 dark:ring-amber-700'
        )}
        onClick={() => setIsExpanded((p) => !p)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            {item.pinned && (
              <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
              </svg>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {title}
                </h3>
                <Badge variant={item.type} size="sm">
                  {TYPE_LABELS[item.type] || item.type}
                </Badge>
                {item.todo?.priority && (
                  <Badge variant={item.todo.priority} size="sm" dot>
                    {item.todo.priority}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {onTogglePin && (
              <button
                onClick={() => onTogglePin(item.id)}
                className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                aria-label={item.pinned ? 'Unpin' : 'Pin'}
                title={item.pinned ? 'Unpin' : 'Pin'}
              >
                <svg className="w-4 h-4" fill={item.pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                </svg>
              </button>
            )}

            {onMoveStatus && item.status === 'todo' && (
              <Button
                size="xs"
                variant="secondary"
                onClick={() => onMoveStatus(item.id, 'process')}
              >
                Start
              </Button>
            )}
            {onMoveStatus && item.status === 'process' && (
              <Button
                size="xs"
                variant="primary"
                onClick={() => onMoveStatus(item.id, 'memo')}
              >
                Complete
              </Button>
            )}

            <button
              onClick={() => navigate(`/items/${item.id}/edit`)}
              className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Edit item"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {onDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Delete item"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 dark:text-slate-500">
          <span>{format(new Date(item.updatedAt), 'MMM d, yyyy')}</span>
          {item.tags.length > 0 && (
            <>
              <span>·</span>
              <span>{item.tags.join(', ')}</span>
            </>
          )}
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <ExpandedContent item={item} />
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}

function ExpandedContent({ item }: { item: AnyItem }) {
  switch (item.type) {
    case 'task':
      return (
        <>
          {item.processMemo.problem && (
            <DetailRow label="Problem" value={item.processMemo.problem} />
          )}
          {item.processMemo.experience && (
            <DetailRow label="Experience" value={item.processMemo.experience} />
          )}
          {item.processMemo.note && (
            <DetailRow label="Note" value={item.processMemo.note} />
          )}
          {item.processMemo.photo && (
            <div className="mt-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Photo</span>
              <img src={item.processMemo.photo} alt="Task photo" className="mt-1 rounded-lg max-h-48 object-cover" />
            </div>
          )}
        </>
      );
    case 'task-it-infra':
      return (
        <>
          {item.processMemo.infra && <DetailRow label="Infra" value={item.processMemo.infra} />}
          {item.processMemo.item && <DetailRow label="Item" value={item.processMemo.item} />}
          {item.processMemo.kind && <DetailRow label="Kind" value={item.processMemo.kind} />}
          {item.processMemo.description && <DetailRow label="Description" value={item.processMemo.description} />}
          {item.processMemo.url_ip && <DetailRow label="URL / IP" value={item.processMemo.url_ip} detectLinks />}
          {item.processMemo.username && <DetailRow label="Username" value={item.processMemo.username} />}
          {item.processMemo.password && <DetailRow label="Password" value={item.processMemo.password} isSecret />}
          {item.processMemo.new_password && <DetailRow label="New Password" value={item.processMemo.new_password} isSecret />}
          {item.processMemo.remark && <DetailRow label="Remark" value={item.processMemo.remark} />}
        </>
      );
    case 'reading-book':
      return (
        <>
          {item.processMemo.book_name && <DetailRow label="Book" value={item.processMemo.book_name} />}
          {item.processMemo.event && <DetailRow label="Event" value={item.processMemo.event} />}
          {item.processMemo.knowledge && <DetailRow label="Knowledge" value={item.processMemo.knowledge} />}
          {item.processMemo.note && <DetailRow label="Notes" value={item.processMemo.note} isMarkdown />}
        </>
      );
    case 'reading-website':
      return (
        <>
          {item.processMemo.website_name && <DetailRow label="Website" value={item.processMemo.website_name} />}
          {item.processMemo.event && <DetailRow label="Event" value={item.processMemo.event} />}
          {item.processMemo.knowledge && <DetailRow label="Knowledge" value={item.processMemo.knowledge} />}
          {item.processMemo.note && <DetailRow label="Notes" value={item.processMemo.note} isMarkdown />}
        </>
      );
    case 'buying':
      return (
        <>
          {item.processMemo.category && <DetailRow label="Category" value={item.processMemo.category} />}
          {item.processMemo.price > 0 && <DetailRow label="Price" value={`$${item.processMemo.price}`} />}
          {item.processMemo.usable_where && <DetailRow label="Usable Where" value={item.processMemo.usable_where} />}
        </>
      );
    case 'trip':
      return (
        <>
          {item.processMemo.destination && <DetailRow label="Destination" value={item.processMemo.destination} />}
          {item.processMemo.companions && <DetailRow label="Companions" value={item.processMemo.companions} />}
          {item.processMemo.date && <DetailRow label="Date" value={item.processMemo.date} />}
          {item.processMemo.duration && <DetailRow label="Duration" value={item.processMemo.duration} />}
          {item.processMemo.experience && <DetailRow label="Experience" value={item.processMemo.experience} />}
          {item.processMemo.photo && (
            <div className="mt-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Photo</span>
              <img src={item.processMemo.photo} alt="Trip photo" className="mt-1 rounded-lg max-h-48 object-cover" />
            </div>
          )}
        </>
      );
    default:
      return null;
  }
}

function DetailRow({
  label,
  value,
  detectLinks,
  isSecret,
  isMarkdown,
}: {
  label: string;
  value: string;
  detectLinks?: boolean;
  isSecret?: boolean;
  isMarkdown?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available
    }
  }, [value]);

  const isUrl = (text: string): boolean => /^https?:\/\//i.test(text);
  const isIp = (text: string): boolean =>
    /^(?:\d{1,3}\.){3}\d{1,3}$/.test(text) || /^[0-9a-f:]+$/i.test(text);

  const renderValue = () => {
    if (isMarkdown) {
      return (
        <pre className="text-xs whitespace-pre-wrap font-mono bg-slate-50 dark:bg-slate-800 rounded-lg p-2 mt-1 text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto">
          {value}
        </pre>
      );
    }

    if (detectLinks && isUrl(value)) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-600 dark:text-brand-400 hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      );
    }

    if (detectLinks && isIp(value)) {
      return <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">{value}</span>;
    }

    return <span className="text-xs text-slate-600 dark:text-slate-400 break-words">{value}</span>;
  };

  return (
    <div>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      {isSecret ? (
        <div className="flex items-center gap-2 mt-0.5" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
            {revealed ? value : '······'}
          </span>
          <button
            onClick={() => setRevealed((r) => !r)}
            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={handleCopy}
            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      ) : (
        <div className="mt-0.5">{renderValue()}</div>
      )}
    </div>
  );
}
