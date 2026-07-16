import { useCallback, useMemo } from 'react';
import { useAppStore, createEmptyItem } from '@/store';
import type { AnyItem, ItemStatus, ItemType, SearchFilters } from '@/types';

export function useItems(status: ItemStatus) {
  const items = useAppStore((s) => s.items);
  const addItem = useAppStore((s) => s.addItem);
  const updateItem = useAppStore((s) => s.updateItem);
  const deleteItem = useAppStore((s) => s.deleteItem);
  const moveItemStatus = useAppStore((s) => s.moveItemStatus);
  const togglePin = useAppStore((s) => s.togglePin);

  const filtered = useMemo(
    () => items
      .filter((it) => it.status === status)
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }),
    [items, status]
  );

  const ofType = useCallback(
    (type: ItemType) => filtered.filter((it) => it.type === type),
    [filtered]
  );

  const groupedByType = useMemo(() => {
    const groups: Partial<Record<ItemType, AnyItem[]>> = {};
    for (const item of filtered) {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type]!.push(item);
    }
    return groups;
  }, [filtered]);

  const createItem = useCallback(
    (type: ItemType) => {
      const item = createEmptyItem(type, status);
      addItem(item);
      return item;
    },
    [status, addItem]
  );

  const startProcessing = useCallback(
    (id: string) => moveItemStatus(id, 'process'),
    [moveItemStatus]
  );

  const complete = useCallback(
    (id: string) => moveItemStatus(id, 'memo'),
    [moveItemStatus]
  );

  const moveBack = useCallback(
    (id: string) => moveItemStatus(id, 'todo'),
    [moveItemStatus]
  );

  return {
    items: filtered,
    groupedByType,
    ofType,
    getItemById: useAppStore.getState().getItemById,
    createItem,
    updateItem,
    deleteItem,
    startProcessing,
    complete,
    moveBack,
    togglePin,
  };
}

export function useMemoSearch() {
  const searchMemoItems = useAppStore((s) => s.searchMemoItems);
  const items = useAppStore((s) => s.items);

  const search = useCallback(
    (filters: SearchFilters) => searchMemoItems(filters.query, {
      type: filters.type,
      category: filters.category,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      pinned: filters.pinned,
    }),
    [searchMemoItems, items]
  );

  return { search };
}
