/**
 * Real API client — talks to the Express backend at /api/*.
 * Attaches JWT auth token to all requests.
 */
import type {
  AnyItem,
  Category,
  ItemStatus,
  ItemType,
  AppStats,
} from '@/types';

const API_BASE = '/api';

// ── Helpers ─────────────────────────────────────────────────

/**
 * Get the auth token from localStorage (persisted by zustand).
 */
function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('second-brain-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...init?.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    // Token expired or invalid — clear persisted auth state
    try {
      const raw = localStorage.getItem('second-brain-auth');
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.state) {
          data.state.user = null;
          data.state.token = null;
          localStorage.setItem('second-brain-auth', JSON.stringify(data));
        }
      }
    } catch { /* ignore */ }
    // Notify auth store to clear in-memory state (avoids hard-reload redirect loop)
    window.dispatchEvent(new Event('auth:session-expired'));
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  const json = await res.json();
  return json.data ?? json;
}

/**
 * Map a backend item (flat todo/processMemo) to the frontend AnyItem shape.
 * Key differences:
 *   - IT infra: backend `item_name` → frontend `item`
 *   - Trip:     backend `trip_date` → frontend `date`
 */
function mapItem(raw: Record<string, unknown>): AnyItem {
  const base = {
    id: raw.id as string,
    type: raw.type as ItemType,
    status: raw.status as ItemStatus,
    createdAt: raw.createdAt as string,
    updatedAt: raw.updatedAt as string,
    pinned: raw.pinned as boolean,
    tags: (raw.tags as string[]) || [],
    sortOrder: (raw.sortOrder as number) ?? (raw.sort_order as number) ?? 0,
  };

  const todo = (raw.todo || {}) as Record<string, unknown>;
  const pm = (raw.processMemo || {}) as Record<string, unknown>;

  switch (raw.type) {
    case 'task-it-infra':
      return {
        ...base,
        type: 'task-it-infra',
        todo: {
          category: todo.category || '',
          name: todo.name || '',
          due_date: todo.due_date || '',
          priority: todo.priority || 'medium',
        },
        processMemo: {
          category: pm.category || '',
          infra: pm.infra || 'server',
          item: pm.item_name || pm.item || '',
          kind: pm.kind || '',
          description: pm.description || '',
          url_ip: pm.url_ip || '',
          username: pm.username || '',
          password: pm.password || '',
          new_password: pm.new_password || '',
          remark: pm.remark || '',
        },
      } as AnyItem;

    case 'trip':
      return {
        ...base,
        type: 'trip',
        todo: {
          destination: todo.destination || '',
          companions: todo.companions || '',
          date: todo.trip_date || todo.date || '',
          duration: todo.duration || '',
          photo_goals: pm.photo_goals || '',
          priority: todo.priority || 'medium',
        },
        processMemo: {
          destination: pm.destination || '',
          companions: pm.companions || '',
          date: todo.trip_date || todo.date || '',
          duration: pm.duration || '',
          experience: pm.experience || '',
          photo: pm.photo || '',
        },
      } as AnyItem;

    case 'buying':
      return {
        ...base,
        type: 'buying',
        todo: {
          category: todo.category || '',
          price: todo.price || 0,
          desired_usability: pm.desired_usability || '',
          priority: todo.priority || 'medium',
        },
        processMemo: {
          category: pm.category || '',
          price: pm.price || 0,
          usable_where: pm.usable_where || '',
        },
      } as AnyItem;

    default:
      return { ...base, todo, processMemo: pm } as unknown as AnyItem;
  }
}

// ── Auth ────────────────────────────────────────────────────

export interface AuthResponse {
  user: { id: string; name: string; email: string };
  token: string;
}

export async function apiRegister(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ── Items ───────────────────────────────────────────────────

export async function fetchItems(params: {
  status?: ItemStatus;
  type?: ItemType;
} = {}): Promise<AnyItem[]> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.type) qs.set('type', params.type);
  const query = qs.toString();
  const raw = await request<Record<string, unknown>[]>(`/items${query ? `?${query}` : ''}`);
  return raw.map(mapItem);
}

export async function fetchItem(id: string): Promise<AnyItem | undefined> {
  const raw = await request<Record<string, unknown>>(`/items/${id}`);
  return mapItem(raw);
}

function flattenItem(item: Partial<AnyItem>): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  // Copy top-level fields
  for (const key of ['id', 'type', 'status', 'pinned', 'tags', 'createdAt', 'updatedAt']) {
    if (key in item) flat[key] = (item as any)[key];
  }
  // Flatten todo fields
  const todo = (item as any).todo;
  if (todo) {
    for (const [k, v] of Object.entries(todo)) {
      if (v !== undefined && v !== null && v !== '') flat[k] = v;
    }
  }
  // Flatten processMemo fields
  const pm = (item as any).processMemo;
  if (pm) {
    for (const [k, v] of Object.entries(pm)) {
      if (v !== undefined && v !== null && v !== '') flat[k] = v;
    }
  }
  return flat;
}

export async function createItem(item: Partial<AnyItem>): Promise<AnyItem> {
  const raw = await request<Record<string, unknown>>('/items', {
    method: 'POST',
    body: JSON.stringify(flattenItem(item)),
  });
  return mapItem(raw);
}

export async function updateItem(
  id: string,
  updates: Partial<AnyItem>
): Promise<AnyItem | undefined> {
  const raw = await request<Record<string, unknown>>(`/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(flattenItem({ ...updates, id })),
  });
  return mapItem(raw);
}

export async function deleteItem(id: string): Promise<void> {
  await request(`/items/${id}`, { method: 'DELETE' });
}

export async function moveItemStatus(
  id: string,
  newStatus: ItemStatus
): Promise<AnyItem | undefined> {
  const raw = await request<Record<string, unknown>>(`/items/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus }),
  });
  return mapItem(raw);
}

export async function reorderItems(
  items: { id: string; sortOrder: number }[]
): Promise<void> {
  await request('/items/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  });
}

// ── Categories ──────────────────────────────────────────────

function mapCategory(raw: Record<string, unknown>): Category {
  return {
    id: String(raw.id),
    name: raw.name as string,
    color: (raw.color as string) || '#6b7280',
    icon: raw.icon as string | undefined,
    createdAt: (raw.created_at as string) || (raw.createdAt as string) || new Date().toISOString(),
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const raw = await request<Record<string, unknown>[]>('/categories');
  return raw.map(mapCategory);
}

export async function createCategory(
  cat: Omit<Category, 'id' | 'createdAt'>
): Promise<Category> {
  return request<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify(cat),
  });
}

export async function updateCategory(
  id: string,
  updates: Partial<Category>
): Promise<Category | undefined> {
  return request<Category>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await request(`/categories/${id}`, { method: 'DELETE' });
}

// ── Stats ───────────────────────────────────────────────────

export async function fetchStats(): Promise<AppStats> {
  return request<AppStats>('/stats');
}
