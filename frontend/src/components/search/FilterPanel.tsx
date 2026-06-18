import type { ItemType } from '@/types';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';

export interface FilterValues {
  type?: ItemType;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  pinned?: boolean;
}

interface FilterPanelProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  onClear: () => void;
}

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'task', label: 'Task' },
  { value: 'task-it-infra', label: 'IT Infra' },
  { value: 'reading-book', label: 'Reading (Book)' },
  { value: 'reading-website', label: 'Reading (Website)' },
  { value: 'buying', label: 'To Buy' },
  { value: 'trip', label: 'Trip' },
];

export function FilterPanel({ filters, onChange, onClear }: FilterPanelProps) {
  const hasFilters =
    filters.type || filters.category || filters.dateFrom || filters.dateTo || filters.pinned;

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
      <div className="w-40">
        <Select
          label="Type"
          options={typeOptions}
          value={filters.type || ''}
          onChange={(e) => onChange({ ...filters, type: (e.target.value || undefined) as ItemType | undefined })}
        />
      </div>
      <div className="w-40">
        <Input
          label="Category"
          placeholder="Filter by category"
          value={filters.category || ''}
          onChange={(e) => onChange({ ...filters, category: e.target.value || undefined })}
        />
      </div>
      <div className="w-36">
        <Input
          label="From"
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || undefined })}
        />
      </div>
      <div className="w-36">
        <Input
          label="To"
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value || undefined })}
        />
      </div>
      <div className="flex items-center pb-1">
        <Toggle
          label="Pinned only"
          checked={filters.pinned || false}
          onChange={(checked) => onChange({ ...filters, pinned: checked || undefined })}
          size="sm"
        />
      </div>
      {hasFilters && (
        <div className="flex items-center pb-1">
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
