import { useCallback, useState } from 'react';
import { useItems } from '@/hooks/useItems';
import { ItemList } from '@/components/items/ItemList';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function ProcessPage() {
  const {
    items,
    groupedByType,
    deleteItem,
    complete,
    togglePin,
  } = useItems('process');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [completeId, setCompleteId] = useState<string | null>(null);

  const handleDelete = useCallback(() => {
    if (deleteId) {
      deleteItem(deleteId);
      setDeleteId(null);
    }
  }, [deleteId, deleteItem]);

  const handleComplete = useCallback(() => {
    if (completeId) {
      complete(completeId);
      setCompleteId(null);
    }
  }, [completeId, complete]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">In Process</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {items.length} item{items.length !== 1 ? 's' : ''} in progress
        </p>
      </div>

      {items.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            When done, click <strong>Complete</strong> to move an item to your Memo archive.
          </p>
        </div>
      )}

      <ItemList
        items={items}
        groupedByType={groupedByType}
        onMoveStatus={(id) => setCompleteId(id)}
        onDelete={(id) => setDeleteId(id)}
        onTogglePin={togglePin}
        status="process"
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      <ConfirmDialog
        open={!!completeId}
        onClose={() => setCompleteId(null)}
        onConfirm={handleComplete}
        title="Complete Item"
        message="Move this item to your Memo archive? It will be saved with all details you've added."
        confirmLabel="Complete"
        variant="primary"
      />
    </div>
  );
}
