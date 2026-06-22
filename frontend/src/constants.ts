import type { ItemType } from '@/types';

export const TYPE_LABELS: Record<ItemType, string> = {
  task: 'Task',
  'task-it-infra': 'IT Infra',
  'reading-book': 'Book',
  'reading-website': 'Website',
  buying: 'Buy',
  trip: 'Trip',
};

export const TYPE_SHORT_LABELS: Record<ItemType, string> = {
  task: 'Task',
  'task-it-infra': 'IT',
  'reading-book': 'Book',
  'reading-website': 'Web',
  buying: 'Buy',
  trip: 'Trip',
};

export const TYPE_DISPLAY_NAMES: Record<ItemType, string> = {
  task: 'Tasks',
  'task-it-infra': 'IT Infrastructure',
  'reading-book': 'Books',
  'reading-website': 'Websites',
  buying: 'To Buy',
  trip: 'Trips',
};
