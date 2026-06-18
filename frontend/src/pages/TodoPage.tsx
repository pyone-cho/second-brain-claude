import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItems } from '@/hooks/useItems';
import { ItemList } from '@/components/items/ItemList';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function TodoPage() {
  const navigate = useNavigate();
  const {
    items,
    groupedByType,
    deleteItem,
    startProcessing,
    togglePin,
  } = useItems('todo');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = useCallback(() => {
    if (deleteId) {
      deleteItem(deleteId);
      setDeleteId(null);
    }
  }, [deleteId, deleteItem]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Todo</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''} to do
          </p>
        </div>
        <Button
          onClick={() => navigate('/items/new')}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Add Item
        </Button>
      </div>

      <ItemList
        items={items}
        groupedByType={groupedByType}
        onMoveStatus={(id) => startProcessing(id)}
        onDelete={(id) => setDeleteId(id)}
        onTogglePin={togglePin}
        status="todo"
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
    </div>
  );
}
