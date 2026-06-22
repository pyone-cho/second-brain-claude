import type { AnyItem, ItemStatus, ItemType } from '@/types';
import { TYPE_DISPLAY_NAMES } from '@/constants';
import { ItemCard } from './ItemCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

interface ItemListProps {
  items: AnyItem[];
  groupedByType: Partial<Record<ItemType, AnyItem[]>>;
  onMoveStatus?: (id: string, newStatus: ItemStatus) => void;
  onDelete?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  status: ItemStatus;
}

const typeOrder: ItemType[] = [
  'task',
  'task-it-infra',
  'reading-book',
  'reading-website',
  'buying',
  'trip',
];

export function ItemList({
  items,
  groupedByType,
  onMoveStatus,
  onDelete,
  onTogglePin,
  status,
}: ItemListProps) {
  if (items.length === 0) {
    return <EmptyStateForStatus status={status} />;
  }

  return (
    <div className="space-y-8">
      {typeOrder.map((type) => {
        const group = groupedByType[type];
        if (!group || group.length === 0) return null;
        return (
          <section key={type}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                {TYPE_DISPLAY_NAMES[type]}
              </h2>
              <Badge variant={type} size="sm">
                {group.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {group.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onMoveStatus={onMoveStatus}
                  onDelete={onDelete}
                  onTogglePin={onTogglePin}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EmptyStateForStatus({ status }: { status: ItemStatus }) {
  switch (status) {
    case 'todo':
      return (
        <EmptyState
          title="No items to do"
          description="Add a new item to get started. Items here represent things you want to do, read, buy, or plan."
        />
      );
    case 'process':
      return (
        <EmptyState
          title="Nothing in progress"
          description="Start working on items from your Todo list. They will appear here while you process them."
          icon={
            <svg className="w-12 h-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      );
    case 'memo':
      return (
        <EmptyState
          title="No archived items"
          description="Complete items from your Process list. Your knowledge archive will grow here over time."
          icon={
            <svg className="w-12 h-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          }
        />
      );
  }
}
