import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { AnyItem, ItemType } from '@/types';
import { fetchItem, createItem, updateItem } from '@/api/mock';
import { ItemForm } from '@/components/items/ItemForm';
import { Card } from '@/components/ui/Card';

export function ItemFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preselectedType = searchParams.get('type') as ItemType | null;

  const [item, setItem] = useState<AnyItem | undefined>(undefined);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!id;

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchItem(id)
      .then((data) => {
        if (!cancelled) {
          if (data) {
            setItem(data);
          } else {
            setError('Item not found.');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load item');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = useCallback(
    async (formItem: AnyItem) => {
      setIsSubmitting(true);
      setError(null);
      try {
        if (isEditing) {
          await updateItem(formItem.id, formItem);
        } else {
          await createItem(formItem);
        }
        navigate(-1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save item');
      } finally {
        setIsSubmitting(false);
      }
    },
    [isEditing, navigate]
  );

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
          <Card padding="md">
            <div className="space-y-3">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </Card>
          <Card padding="md">
            <div className="space-y-3">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error && isEditing) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card padding="lg" className="text-center">
          <div className="flex flex-col items-center gap-4 py-8">
            <svg className="w-12 h-12 text-red-300 dark:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Error Loading Item</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {isEditing ? 'Edit Item' : 'New Item'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isEditing ? 'Update item details' : 'Add a new item to your second brain'}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <ItemForm
        initialItem={item}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
