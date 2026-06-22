import type { AnyItem } from '@/types';

export function getItemTitle(item: AnyItem): string {
  switch (item.type) {
    case 'task':
    case 'task-it-infra':
      return item.todo.name || 'Untitled Task';
    case 'reading-book':
      return item.todo.title || 'Untitled Book';
    case 'reading-website':
      return item.todo.title || 'Untitled Website';
    case 'buying':
      return item.todo.category || 'Purchase';
    case 'trip':
      return item.todo.destination || 'Untitled Trip';
    default:
      return 'Untitled';
  }
}

export function getItemSubtitle(item: AnyItem): string | null {
  switch (item.type) {
    case 'task':
    case 'task-it-infra':
      return item.todo.category || null;
    case 'reading-book':
      return item.todo.author ? `by ${item.todo.author}` : null;
    case 'reading-website':
      return item.todo.url || null;
    case 'buying':
      return item.todo.price ? `$${item.todo.price}` : null;
    case 'trip':
      return item.todo.date || null;
    default:
      return null;
  }
}
