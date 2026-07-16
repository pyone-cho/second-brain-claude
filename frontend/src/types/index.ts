// ── Enums & Literals ──────────────────────────────────────────

export type ItemStatus = 'todo' | 'process' | 'memo';
export type ItemType = 'task' | 'task-it-infra' | 'reading-book' | 'reading-website' | 'buying' | 'trip';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type InfraType = 'server' | 'network' | 'cloud';

// ── Category ──────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
}

// ── Base Item ─────────────────────────────────────────────────

export interface BaseItem {
  id: string;
  type: ItemType;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  tags: string[];
  sortOrder: number;
}

// ── Task (Ordinary) ───────────────────────────────────────────

export interface TaskTodo {
  category: string;
  name: string;
  due_date: string;
  priority?: Priority;
}

export interface TaskProcessMemo {
  category: string;
  problem: string;
  experience: string;
  note: string;
  photo?: string; // data URL
}

export interface TaskItem extends BaseItem {
  type: 'task';
  todo: TaskTodo;
  processMemo: TaskProcessMemo;
}

// ── Task (IT Infra) ───────────────────────────────────────────

export interface ITInfraTodo {
  category: string;
  name: string;
  due_date: string;
  priority?: Priority;
}

export interface ITInfraProcessMemo {
  category: string;
  infra: InfraType;
  item: string;
  kind: string;
  description: string;
  url_ip: string;
  username: string;
  password: string;
  new_password: string;
  remark: string;
}

export interface ITInfraItem extends BaseItem {
  type: 'task-it-infra';
  todo: ITInfraTodo;
  processMemo: ITInfraProcessMemo;
}

// ── To Read (Book) ────────────────────────────────────────────

export interface ReadingBookTodo {
  title: string;
  author: string;
  priority: Priority;
}

export interface ReadingBookProcessMemo {
  book_name: string;
  event: string;
  knowledge: string;
  note: string; // markdown
  book_pdf?: string; // data URL or file path
}

export interface ReadingBookItem extends BaseItem {
  type: 'reading-book';
  todo: ReadingBookTodo;
  processMemo: ReadingBookProcessMemo;
}

// ── To Read (Website) ─────────────────────────────────────────

export interface ReadingWebsiteTodo {
  url: string;
  title: string;
  priority: Priority;
}

export interface ReadingWebsiteProcessMemo {
  website_name: string;
  event: string;
  knowledge: string;
  note: string; // markdown
}

export interface ReadingWebsiteItem extends BaseItem {
  type: 'reading-website';
  todo: ReadingWebsiteTodo;
  processMemo: ReadingWebsiteProcessMemo;
}

// ── To Buy ────────────────────────────────────────────────────

export interface BuyingTodo {
  category: string;
  price: number;
  desired_usability: string;
  priority?: Priority;
}

export interface BuyingProcessMemo {
  category: string;
  price: number;
  usable_where: string;
}

export interface BuyingItem extends BaseItem {
  type: 'buying';
  todo: BuyingTodo;
  processMemo: BuyingProcessMemo;
}

// ── Trip Plan ─────────────────────────────────────────────────

export interface TripTodo {
  destination: string;
  companions: string;
  date: string;
  duration: string;
  photo_goals: string;
  priority?: Priority;
}

export interface TripProcessMemo {
  destination: string;
  companions: string;
  date: string;
  duration: string;
  experience: string;
  photo?: string; // data URL, 9:16 crop
}

export interface TripItem extends BaseItem {
  type: 'trip';
  todo: TripTodo;
  processMemo: TripProcessMemo;
}

// ── Union Type ────────────────────────────────────────────────

export type AnyItem =
  | TaskItem
  | ITInfraItem
  | ReadingBookItem
  | ReadingWebsiteItem
  | BuyingItem
  | TripItem;

// ── Stats ─────────────────────────────────────────────────────

export interface AppStats {
  totalTodo: number;
  totalProcess: number;
  totalMemo: number;
  byType: Record<ItemType, number>;
  booksToRead: number;
  upcomingTrips: number;
}

// ── Form types ────────────────────────────────────────────────

export type TodoFormData = {
  type: ItemType;
  // task / task-it-infra
  category?: string;
  name?: string;
  due_date?: string;
  priority?: Priority;
  // reading-book
  title?: string;
  author?: string;
  // reading-website
  url?: string;
  // buying
  price?: number;
  desired_usability?: string;
  // trip
  destination?: string;
  companions?: string;
  date?: string;
  duration?: string;
  photo_goals?: string;
};

export type ProcessMemoFormData = {
  // task
  category?: string;
  problem?: string;
  experience?: string;
  note?: string;
  photo?: string;
  // task-it-infra
  infra?: InfraType;
  item?: string;
  kind?: string;
  description?: string;
  url_ip?: string;
  username?: string;
  password?: string;
  new_password?: string;
  remark?: string;
  // reading-book
  book_name?: string;
  event?: string;
  knowledge?: string;
  book_pdf?: string;
  // reading-website
  website_name?: string;
  // buying
  price?: number;
  usable_where?: string;
  // trip
  companions_update?: string;
  date_update?: string;
  duration_update?: string;
};

// ── Search ────────────────────────────────────────────────────

export interface SearchResult {
  item: AnyItem;
  matches: string[];
  score: number;
}

export interface SearchFilters {
  query: string;
  type?: ItemType;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  pinned?: boolean;
}
