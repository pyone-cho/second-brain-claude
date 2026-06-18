import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AnyItem,
  Category,
  ItemStatus,
  ItemType,
} from '@/types';

// ── Helpers ───────────────────────────────────────────────────

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Work', color: '#3b82f6', icon: 'briefcase', createdAt: new Date().toISOString() },
  { id: 'cat-2', name: 'Personal', color: '#10b981', icon: 'user', createdAt: new Date().toISOString() },
  { id: 'cat-3', name: 'Learning', color: '#f59e0b', icon: 'book-open', createdAt: new Date().toISOString() },
  { id: 'cat-4', name: 'Health', color: '#ef4444', icon: 'heart', createdAt: new Date().toISOString() },
  { id: 'cat-5', name: 'Finance', color: '#8b5cf6', icon: 'dollar-sign', createdAt: new Date().toISOString() },
  { id: 'cat-6', name: 'Home', color: '#ec4899', icon: 'home', createdAt: new Date().toISOString() },
  { id: 'cat-7', name: 'Travel', color: '#06b6d4', icon: 'map', createdAt: new Date().toISOString() },
];

function generateId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ── Store ─────────────────────────────────────────────────────

interface AppState {
  // State
  items: AnyItem[];
  categories: Category[];
  theme: 'light' | 'dark' | 'system';

  // Item actions
  addItem: (item: AnyItem) => void;
  updateItem: (id: string, updates: Partial<AnyItem>) => void;
  deleteItem: (id: string) => void;
  moveItemStatus: (id: string, newStatus: ItemStatus) => void;
  togglePin: (id: string) => void;

  // Category actions
  addCategory: (cat: Omit<Category, 'id' | 'createdAt'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Theme
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Queries
  getItemsByStatus: (status: ItemStatus) => AnyItem[];
  getItemsByType: (status: ItemStatus, type: ItemType) => AnyItem[];
  getItemById: (id: string) => AnyItem | undefined;
  searchMemoItems: (query: string, filters?: {
    type?: ItemType;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    pinned?: boolean;
  }) => AnyItem[];
  getStats: () => {
    totalTodo: number;
    totalProcess: number;
    totalMemo: number;
    byType: Record<ItemType, number>;
    booksToRead: number;
    upcomingTrips: number;
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      items: [],
      categories: DEFAULT_CATEGORIES,
      theme: 'system',

      // ── Item actions ──────────────────────────────────

      addItem: (item) =>
        set((s) => ({ items: [...s.items, item] })),

      updateItem: (id, updates) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id
              ? { ...it, ...updates, updatedAt: nowISO() } as AnyItem
              : it
          ),
        })),

      deleteItem: (id) =>
        set((s) => ({ items: s.items.filter((it) => it.id !== id) })),

      moveItemStatus: (id, newStatus) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id
              ? { ...it, status: newStatus, updatedAt: nowISO() } as AnyItem
              : it
          ),
        })),

      togglePin: (id) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id ? { ...it, pinned: !it.pinned } as AnyItem : it
          ),
        })),

      // ── Category actions ──────────────────────────────

      addCategory: (cat) => {
        const newCat: Category = {
          ...cat,
          id: `cat-${Date.now()}`,
          createdAt: nowISO(),
        };
        set((s) => ({ categories: [...s.categories, newCat] }));
        return newCat;
      },

      updateCategory: (id, updates) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
        })),

      // ── Theme ─────────────────────────────────────────

      setTheme: (theme) => set({ theme }),

      // ── Queries ───────────────────────────────────────

      getItemsByStatus: (status) =>
        get().items
          .filter((it) => it.status === status)
          .sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          ),

      getItemsByType: (status, type) =>
        get().items
          .filter((it) => it.status === status && it.type === type)
          .sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          ),

      getItemById: (id) => get().items.find((it) => it.id === id),

      searchMemoItems: (query, filters) => {
        const memo = get().items.filter((it) => it.status === 'memo');
        let results = memo;

        if (filters?.type) {
          results = results.filter((it) => it.type === filters.type);
        }
        if (filters?.pinned) {
          results = results.filter((it) => it.pinned);
        }
        if (filters?.dateFrom) {
          results = results.filter(
            (it) => new Date(it.updatedAt) >= new Date(filters.dateFrom!)
          );
        }
        if (filters?.dateTo) {
          results = results.filter(
            (it) => new Date(it.updatedAt) <= new Date(filters.dateTo!)
          );
        }

        if (query.trim()) {
          const q = query.toLowerCase();
          results = results.filter((item) => {
            const searchable = extractSearchText(item);
            if (filters?.category) {
              const cat = getCategoryFromItem(item);
              if (!cat.toLowerCase().includes(filters.category.toLowerCase())) {
                return false;
              }
            }
            return searchable.toLowerCase().includes(q);
          });
        } else if (filters?.category) {
          const catFilter = filters.category.toLowerCase();
          results = results.filter((item) => {
            const cat = getCategoryFromItem(item);
            return cat.toLowerCase().includes(catFilter);
          });
        }

        return results.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      },

      getStats: () => {
        const items = get().items;
        const byType: Record<ItemType, number> = {
          task: 0,
          'task-it-infra': 0,
          'reading-book': 0,
          'reading-website': 0,
          buying: 0,
          trip: 0,
        };

        let totalTodo = 0;
        let totalProcess = 0;
        let totalMemo = 0;
        let booksToRead = 0;
        let upcomingTrips = 0;

        for (const item of items) {
          byType[item.type] = (byType[item.type] || 0) + 1;
          if (item.status === 'todo') totalTodo++;
          else if (item.status === 'process') totalProcess++;
          else if (item.status === 'memo') totalMemo++;

          if (
            (item.type === 'reading-book' || item.type === 'reading-website') &&
            item.status === 'todo'
          ) {
            booksToRead++;
          }

          if (item.type === 'trip' && item.status !== 'memo') {
            upcomingTrips++;
          }
        }

        return { totalTodo, totalProcess, totalMemo, byType, booksToRead, upcomingTrips };
      },
    }),
    {
      name: 'second-brain-storage',
      version: 1,
    }
  )
);

// ── Helpers ───────────────────────────────────────────────────

function extractSearchText(item: AnyItem): string {
  switch (item.type) {
    case 'task': {
      const t = item as import('@/types').TaskItem;
      return [
        t.todo.name,
        t.todo.category,
        t.processMemo.problem,
        t.processMemo.experience,
        t.processMemo.note,
      ].join(' ');
    }
    case 'task-it-infra': {
      const t = item as import('@/types').ITInfraItem;
      return [
        t.todo.name,
        t.todo.category,
        t.processMemo.infra,
        t.processMemo.item,
        t.processMemo.kind,
        t.processMemo.description,
        t.processMemo.url_ip,
        t.processMemo.username,
        t.processMemo.remark,
      ].join(' ');
    }
    case 'reading-book': {
      const t = item as import('@/types').ReadingBookItem;
      return [
        t.todo.title,
        t.todo.author,
        t.processMemo.book_name,
        t.processMemo.event,
        t.processMemo.knowledge,
        t.processMemo.note,
      ].join(' ');
    }
    case 'reading-website': {
      const t = item as import('@/types').ReadingWebsiteItem;
      return [
        t.todo.url,
        t.todo.title,
        t.processMemo.website_name,
        t.processMemo.event,
        t.processMemo.knowledge,
        t.processMemo.note,
      ].join(' ');
    }
    case 'buying': {
      const t = item as import('@/types').BuyingItem;
      return [
        t.todo.category,
        String(t.todo.price),
        t.todo.desired_usability,
        t.processMemo.usable_where,
      ].join(' ');
    }
    case 'trip': {
      const t = item as import('@/types').TripItem;
      return [
        t.todo.destination,
        t.todo.companions,
        t.todo.duration,
        t.todo.photo_goals,
        t.processMemo.destination,
        t.processMemo.experience,
      ].join(' ');
    }
  }
}

function getCategoryFromItem(item: AnyItem): string {
  switch (item.type) {
    case 'task': {
      const t = item as import('@/types').TaskItem;
      return item.status === 'todo' ? t.todo.category : t.processMemo.category;
    }
    case 'task-it-infra': {
      const t = item as import('@/types').ITInfraItem;
      return item.status === 'todo' ? t.todo.category : t.processMemo.category;
    }
    case 'reading-book':
      return 'Books';
    case 'reading-website':
      return 'Websites';
    case 'buying': {
      const t = item as import('@/types').BuyingItem;
      return item.status === 'todo' ? t.todo.category : t.processMemo.category;
    }
    case 'trip':
      return 'Travel';
  }
}

// ── Factory helpers ───────────────────────────────────────────

export function createEmptyItem(type: ItemType, status: ItemStatus): AnyItem {
  const base = {
    id: generateId(),
    type,
    status,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    pinned: false,
    tags: [] as string[],
  };

  switch (type) {
    case 'task':
      return {
        ...base,
        type: 'task' as const,
        todo: { category: '', name: '', due_date: '', priority: 'medium' },
        processMemo: { category: '', problem: '', experience: '', note: '' },
      } as TaskItem;

    case 'task-it-infra':
      return {
        ...base,
        type: 'task-it-infra' as const,
        todo: { category: '', name: '', due_date: '', priority: 'medium' },
        processMemo: {
          category: '',
          infra: 'server',
          item: '',
          kind: '',
          description: '',
          url_ip: '',
          username: '',
          password: '',
          new_password: '',
          remark: '',
        },
      } as ITInfraItem;

    case 'reading-book':
      return {
        ...base,
        type: 'reading-book' as const,
        todo: { title: '', author: '', priority: 'medium' },
        processMemo: { book_name: '', event: '', knowledge: '', note: '' },
      } as ReadingBookItem;

    case 'reading-website':
      return {
        ...base,
        type: 'reading-website' as const,
        todo: { url: '', title: '', priority: 'medium' },
        processMemo: { website_name: '', event: '', knowledge: '', note: '' },
      } as ReadingWebsiteItem;

    case 'buying':
      return {
        ...base,
        type: 'buying' as const,
        todo: { category: '', price: 0, desired_usability: '', priority: 'medium' },
        processMemo: { category: '', price: 0, usable_where: '' },
      } as BuyingItem;

    case 'trip':
      return {
        ...base,
        type: 'trip' as const,
        todo: {
          destination: '',
          companions: '',
          date: '',
          duration: '',
          photo_goals: '',
          priority: 'medium',
        },
        processMemo: {
          destination: '',
          companions: '',
          date: '',
          duration: '',
          experience: '',
        },
      } as TripItem;
  }
}

// Re-import needed types for the factory
import type {
  TaskItem,
  ITInfraItem,
  ReadingBookItem,
  ReadingWebsiteItem,
  BuyingItem,
  TripItem,
} from '@/types';
