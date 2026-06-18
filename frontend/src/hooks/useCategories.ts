import { useAppStore } from '@/store';
import type { Category } from '@/types';

export function useCategories() {
  const categories = useAppStore((s) => s.categories);
  const addCategory = useAppStore((s) => s.addCategory);
  const updateCategory = useAppStore((s) => s.updateCategory);
  const deleteCategory = useAppStore((s) => s.deleteCategory);

  const getCategoryById = (id: string): Category | undefined =>
    categories.find((c) => c.id === id);

  const getCategoryByName = (name: string): Category | undefined =>
    categories.find((c) => c.name.toLowerCase() === name.toLowerCase());

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoryByName,
  };
}
