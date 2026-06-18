/**
 * Mock API layer that delegates to the Zustand store.
 * In production, replace these with actual fetch calls to /api/*.
 */
import { useAppStore } from '@/store';
import type {
  AnyItem,
  Category,
  ItemStatus,
  ItemType,
  AppStats,
} from '@/types';

// ── Items ─────────────────────────────────────────────────────

export async function fetchItems(params: {
  status?: ItemStatus;
  type?: ItemType;
}): Promise<AnyItem[]> {
  // Simulate network latency
  await delay(80);
  const store = useAppStore.getState();
  let items = store.items;

  if (params.status) {
    items = items.filter((it) => it.status === params.status);
  }
  if (params.type) {
    items = items.filter((it) => it.type === params.type);
  }

  return items.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function fetchItem(id: string): Promise<AnyItem | undefined> {
  await delay(50);
  return useAppStore.getState().getItemById(id);
}

export async function createItem(item: AnyItem): Promise<AnyItem> {
  await delay(100);
  useAppStore.getState().addItem(item);
  return item;
}

export async function updateItem(
  id: string,
  updates: Partial<AnyItem>
): Promise<AnyItem | undefined> {
  await delay(100);
  useAppStore.getState().updateItem(id, updates);
  return useAppStore.getState().getItemById(id);
}

export async function deleteItem(id: string): Promise<void> {
  await delay(80);
  useAppStore.getState().deleteItem(id);
}

export async function moveItemStatus(
  id: string,
  newStatus: ItemStatus
): Promise<AnyItem | undefined> {
  await delay(100);
  useAppStore.getState().moveItemStatus(id, newStatus);
  return useAppStore.getState().getItemById(id);
}

// ── Categories ────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  await delay(60);
  return useAppStore.getState().categories;
}

export async function createCategory(
  cat: Omit<Category, 'id' | 'createdAt'>
): Promise<Category> {
  await delay(80);
  return useAppStore.getState().addCategory(cat);
}

export async function updateCategory(
  id: string,
  updates: Partial<Category>
): Promise<Category | undefined> {
  await delay(80);
  useAppStore.getState().updateCategory(id, updates);
  return useAppStore.getState().categories.find((c) => c.id === id);
}

export async function deleteCategory(id: string): Promise<void> {
  await delay(80);
  useAppStore.getState().deleteCategory(id);
}

// ── Stats ─────────────────────────────────────────────────────

export async function fetchStats(): Promise<AppStats> {
  await delay(70);
  return useAppStore.getState().getStats();
}

// ── Utils ─────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
