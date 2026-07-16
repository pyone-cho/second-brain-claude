import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore } from '@/store';
import type { AnyItem, ItemStatus } from '@/types';
import { TYPE_SHORT_LABELS } from '@/constants';
import { getItemTitle } from '@/utils/item';
import { Badge } from '@/components/ui/Badge';

// ── Types ───────────────────────────────────────────────────

interface KanbanColumn {
  id: ItemStatus;
  label: string;
  color: string;
  headerBg: string;
  headerText: string;
  countBg: string;
}

const COLUMNS: KanbanColumn[] = [
  {
    id: 'todo',
    label: 'To Do',
    color: 'amber',
    headerBg: 'bg-amber-50 dark:bg-amber-950/30',
    headerText: 'text-amber-700 dark:text-amber-300',
    countBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'process',
    label: 'In Progress',
    color: 'blue',
    headerBg: 'bg-blue-50 dark:bg-blue-950/30',
    headerText: 'text-blue-700 dark:text-blue-300',
    countBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  },
  {
    id: 'memo',
    label: 'Done',
    color: 'green',
    headerBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    headerText: 'text-emerald-700 dark:text-emerald-300',
    countBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  },
];

// ── KanbanCard ──────────────────────────────────────────────

function KanbanCard({
  item,
  overlay,
}: {
  item: AnyItem;
  overlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { type: 'item', item },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const priority = item.type === 'task' || item.type === 'task-it-infra'
    ? item.todo.priority
    : undefined;

  const dueDate = (item.type === 'task' || item.type === 'task-it-infra')
    ? item.todo.due_date
    : undefined;

  const cardContent = (
    <div className="flex items-start gap-2.5">
      <Badge variant={item.type} size="sm" dot>
        {TYPE_SHORT_LABELS[item.type] || item.type}
      </Badge>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate leading-snug">
          {getItemTitle(item)}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          {priority && priority !== 'low' && (
            <Badge variant={priority} size="sm">{priority}</Badge>
          )}
          {dueDate && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
      {item.pinned && (
        <svg className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
        </svg>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-3 rotate-2 scale-105">
        {cardContent}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-3 cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all duration-150 touch-none"
    >
      {cardContent}
    </div>
  );
}

// ── KanbanColumn ────────────────────────────────────────────

function KanbanColumn({
  column,
  items,
}: {
  column: KanbanColumn;
  items: AnyItem[];
}) {
  const itemIds = useMemo(() => items.map((i) => i.id), [items]);

  return (
    <div className="flex flex-col min-h-0">
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl ${column.headerBg}`}>
        <h3 className={`text-sm font-semibold ${column.headerText}`}>
          {column.label}
        </h3>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${column.countBg}`}>
          {items.length}
        </span>
      </div>

      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto rounded-b-xl bg-slate-50/50 dark:bg-slate-900/30 p-2 space-y-2 min-h-[120px]">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Drop items here
              </p>
            </div>
          ) : (
            items.map((item) => (
              <KanbanCard key={item.id} item={item} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ── KanbanPage ──────────────────────────────────────────────

export function KanbanPage() {
  const allItems = useAppStore((s) => s.items);
  const moveItemStatus = useAppStore((s) => s.moveItemStatus);
  const reorderItems = useAppStore((s) => s.reorderItems);

  const [activeItem, setActiveItem] = useState<AnyItem | null>(null);
  const [localItems, setLocalItems] = useState<Record<ItemStatus, AnyItem[]>>({
    todo: [],
    process: [],
    memo: [],
  });
  const [initialized, setInitialized] = useState(false);

  // Sync local state from store
  useMemo(() => {
    const grouped: Record<ItemStatus, AnyItem[]> = { todo: [], process: [], memo: [] };
    for (const item of allItems) {
      if (grouped[item.status]) {
        grouped[item.status].push(item);
      }
    }
    // Sort each column by sortOrder, then updatedAt
    for (const status of Object.keys(grouped) as ItemStatus[]) {
      grouped[status].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }
    setLocalItems(grouped);
    setInitialized(true);
  }, [allItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const findColumn = useCallback((id: string): ItemStatus | null => {
    if (id in localItems) return id as ItemStatus;
    for (const [status, items] of Object.entries(localItems)) {
      if (items.some((item) => item.id === id)) return status as ItemStatus;
    }
    return null;
  }, [localItems]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const item = allItems.find((i) => i.id === active.id);
    if (item) setActiveItem(item);
  }, [allItems]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    setLocalItems((prev) => {
      const sourceItems = [...prev[activeColumn]];
      const destItems = [...prev[overColumn]];

      const activeIndex = sourceItems.findIndex((i) => i.id === activeId);
      if (activeIndex === -1) return prev;

      const [movedItem] = sourceItems.splice(activeIndex, 1);
      const updatedItem = { ...movedItem, status: overColumn } as AnyItem;

      const overIndex = destItems.findIndex((i) => i.id === overId);
      if (overIndex >= 0) {
        destItems.splice(overIndex, 0, updatedItem);
      } else {
        destItems.push(updatedItem);
      }

      return { ...prev, [activeColumn]: sourceItems, [overColumn]: destItems };
    });
  }, [findColumn]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) {
      setLocalItems((prev) => {
        const grouped: Record<ItemStatus, AnyItem[]> = { todo: [], process: [], memo: [] };
        for (const item of allItems) {
          if (grouped[item.status]) grouped[item.status].push(item);
        }
        for (const status of Object.keys(grouped) as ItemStatus[]) {
          grouped[status].sort((a, b) => {
            if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
        }
        return grouped;
      });
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId);

    if (!activeColumn || !overColumn) return;

    if (activeColumn === overColumn) {
      // Reorder within column
      setLocalItems((prev) => {
        const items = [...prev[activeColumn]];
        const oldIndex = items.findIndex((i) => i.id === activeId);
        const newIndex = items.findIndex((i) => i.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
        const reordered = arrayMove(items, oldIndex, newIndex);
        return { ...prev, [activeColumn]: reordered };
      });
    }

    // Persist changes
    const finalItems = (() => {
      const grouped = { ...localItems };
      if (activeColumn !== overColumn) {
        // Item was already moved by onDragOver, just ensure correct state
      }
      return grouped;
    })();

    // Compute final state after local state updates
    await new Promise((r) => setTimeout(r, 0));

    setLocalItems((prev) => {
      // Check if the active item changed status
      const sourceCol = prev[activeColumn]?.find((i) => i.id === activeId);
      const movedToDifferentColumn = sourceCol === undefined;

      if (movedToDifferentColumn) {
        // Item was moved to a different column by onDragOver
        const targetItems = prev[overColumn];
        const targetIndex = targetItems.findIndex((i) => i.id === activeId);
        if (targetIndex >= 0 && activeColumn !== overColumn) {
          moveItemStatus(activeId, overColumn).catch(console.error);
        }
      }

      // Persist order for the affected column(s)
      const columnsToSave = movedToDifferentColumn
        ? [overColumn]
        : [activeColumn];

      for (const col of columnsToSave) {
        const items = prev[col].map((item, index) => ({
          id: item.id,
          sortOrder: index,
        }));
        reorderItems(items).catch(console.error);
      }

      return prev;
    });
  }, [allItems, findColumn, localItems, moveItemStatus, reorderItems]);

  if (!initialized) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Board
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Drag items between columns to update status
        </p>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              items={localItems[column.id] || []}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeItem ? <KanbanCard item={activeItem} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
