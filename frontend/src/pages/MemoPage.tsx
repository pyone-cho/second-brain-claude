import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItems, useMemoSearch } from '@/hooks/useItems';
import { MemoTable } from '@/components/tables/MemoTable';
import { ITInfraTable } from '@/components/tables/ITInfraTable';
import { ItemList } from '@/components/items/ItemList';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import type { FilterValues } from '@/components/search/FilterPanel';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ITInfraItem, SearchFilters } from '@/types';

type ViewMode = 'cards' | 'table';

export function MemoPage() {
  const navigate = useNavigate();
  const {
    items: allMemoItems,
    groupedByType,
    deleteItem,
    togglePin,
  } = useItems('memo');
  const { search } = useMemoSearch();

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterValues>({});
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [showFilters, setShowFilters] = useState(false);
  const [showITInfraOnly, setShowITInfraOnly] = useState(false);

  const searchFilters: SearchFilters = useMemo(() => ({
    query,
    ...filters,
  }), [query, filters]);

  const searchResults = useMemo(() => search(searchFilters), [search, searchFilters]);

  const isFiltering = query.trim() !== '' || !!filters.type || !!filters.category || !!filters.dateFrom || !!filters.dateTo || !!filters.pinned;
  const displayItems = isFiltering ? searchResults : allMemoItems;

  const itInfraItems = useMemo(
    () => displayItems.filter((i): i is ITInfraItem => i.type === 'task-it-infra'),
    [displayItems]
  );

  const handleClearFilters = () => {
    setQuery('');
    setFilters({});
    setShowITInfraOnly(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Memo Archive</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {allMemoItems.length} item{allMemoItems.length !== 1 ? 's' : ''} archived
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Toggle
            label="IT Infra View"
            checked={showITInfraOnly}
            onChange={setShowITInfraOnly}
            size="sm"
          />
          <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-inset ${
                viewMode === 'cards'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-inset ${
                viewMode === 'table'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search memo archive..."
          className="flex-1 max-w-md"
        />
        <Button
          variant={showFilters ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setShowFilters((f) => !f)}
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </Button>
      </div>

      {showFilters && (
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters({})}
        />
      )}

      <div key={viewMode} className="animate-fade-in">
      {displayItems.length === 0 ? (
        isFiltering ? (
          <EmptyState
            title="No results found"
            description="Try adjusting your search query or filters."
            action={
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Search
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No archived items"
            description="Complete items from your Process list to build your knowledge archive."
          />
        )
      ) : showITInfraOnly ? (
        <ITInfraTable
          items={itInfraItems}
          onTogglePin={togglePin}
          onEdit={(id) => navigate(`/items/${id}/edit`)}
          onDelete={(id) => deleteItem(id)}
        />
      ) : viewMode === 'table' ? (
        <MemoTable
          items={displayItems}
          onTogglePin={togglePin}
          onEdit={(id) => navigate(`/items/${id}/edit`)}
          onDelete={(id) => deleteItem(id)}
        />
      ) : (
        <ItemList
          items={displayItems}
          groupedByType={(() => {
            const groups: Record<string, typeof displayItems> = {};
            for (const item of displayItems) {
              if (!groups[item.type]) groups[item.type] = [];
              groups[item.type].push(item);
            }
            return groups;
          })()}
          onTogglePin={togglePin}
          onDelete={(id) => deleteItem(id)}
          status="memo"
        />
      )}

      </div>
    </div>
  );
}
