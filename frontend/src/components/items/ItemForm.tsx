import { useState, useCallback, useRef, type FormEvent } from 'react';
import type { AnyItem, ItemType, Priority, InfraType, ItemStatus } from '@/types';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createEmptyItem } from '@/store';

interface ItemFormProps {
  initialItem?: AnyItem;
  onSubmit: (item: AnyItem) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const itemTypeOptions = [
  { value: 'task', label: 'Task' },
  { value: 'task-it-infra', label: 'IT Infrastructure Task' },
  { value: 'reading-book', label: 'Reading (Book)' },
  { value: 'reading-website', label: 'Reading (Website)' },
  { value: 'buying', label: 'To Buy' },
  { value: 'trip', label: 'Trip Plan' },
];

const priorityOptions = [
  { value: '', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const infraOptions = [
  { value: 'server', label: 'Server' },
  { value: 'network', label: 'Network' },
  { value: 'cloud', label: 'Cloud' },
];

export function ItemForm({ initialItem, onSubmit, onCancel, isSubmitting }: ItemFormProps) {
  const isEditing = !!initialItem;
  const [item, setItem] = useState<AnyItem>(
    initialItem || createEmptyItem('task', 'todo')
  );

  const photoInputRef = useRef<HTMLInputElement>(null);

  const setType = useCallback((type: ItemType) => {
    setItem((prev) => {
      const fresh = createEmptyItem(type, prev.status);
      return { ...fresh, id: prev.id, createdAt: prev.createdAt, tags: prev.tags, pinned: prev.pinned };
    });
  }, []);

  const updateTodo = useCallback((field: string, value: any) => {
    setItem((prev) => {
      const updated = { ...prev } as any;
      if (!updated.todo) updated.todo = {};
      updated.todo[field] = value;
      return updated as AnyItem;
    });
  }, []);

  const updateProcessMemo = useCallback((field: string, value: any) => {
    setItem((prev) => {
      const updated = { ...prev } as any;
      if (!updated.processMemo) updated.processMemo = {};
      updated.processMemo[field] = value;
      return updated as AnyItem;
    });
  }, []);

  const handlePhotoUpload = useCallback(
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        updateProcessMemo(field, reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [updateProcessMemo]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...item,
      updatedAt: new Date().toISOString(),
    });
  };

  const todo = (item as any).todo || {};
  const pm = (item as any).processMemo || {};

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Item type selector */}
      <Card padding="md">
        <Select
          label="Item Type"
          options={itemTypeOptions}
          value={item.type}
          onChange={(e) => setType(e.target.value as ItemType)}
          disabled={isEditing}
        />
      </Card>

      {/* Todo fields */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Todo Details
        </h3>

        <div className="space-y-4">
          {(item.type === 'task' || item.type === 'task-it-infra') && (
            <>
              <Input
                label="Category"
                placeholder="e.g. Work, Personal"
                value={todo.category || ''}
                onChange={(e) => updateTodo('category', e.target.value)}
              />
              <Input
                label="Name"
                placeholder="Task name"
                value={todo.name || ''}
                onChange={(e) => updateTodo('name', e.target.value)}
                required
              />
              <Input
                label="Due Date"
                type="date"
                value={todo.due_date || ''}
                onChange={(e) => updateTodo('due_date', e.target.value)}
              />
              <Select
                label="Priority"
                options={priorityOptions}
                value={todo.priority || ''}
                onChange={(e) => updateTodo('priority', e.target.value || undefined)}
              />
            </>
          )}

          {item.type === 'reading-book' && (
            <>
              <Input
                label="Title"
                placeholder="Book title"
                value={todo.title || ''}
                onChange={(e) => updateTodo('title', e.target.value)}
                required
              />
              <Input
                label="Author"
                placeholder="Author name"
                value={todo.author || ''}
                onChange={(e) => updateTodo('author', e.target.value)}
              />
              <Select
                label="Priority"
                options={priorityOptions}
                value={todo.priority || 'medium'}
                onChange={(e) => updateTodo('priority', e.target.value as Priority)}
              />
            </>
          )}

          {item.type === 'reading-website' && (
            <>
              <Input
                label="URL"
                placeholder="https://..."
                type="url"
                value={todo.url || ''}
                onChange={(e) => updateTodo('url', e.target.value)}
                required
              />
              <Input
                label="Title"
                placeholder="Article / page title"
                value={todo.title || ''}
                onChange={(e) => updateTodo('title', e.target.value)}
                required
              />
              <Select
                label="Priority"
                options={priorityOptions}
                value={todo.priority || 'medium'}
                onChange={(e) => updateTodo('priority', e.target.value as Priority)}
              />
            </>
          )}

          {item.type === 'buying' && (
            <>
              <Input
                label="Category"
                placeholder="e.g. Electronics, Groceries"
                value={todo.category || ''}
                onChange={(e) => updateTodo('category', e.target.value)}
                required
              />
              <Input
                label="Price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={todo.price || ''}
                onChange={(e) => updateTodo('price', parseFloat(e.target.value) || 0)}
              />
              <Textarea
                label="Desired Usability"
                placeholder="What do you want to use this for?"
                value={todo.desired_usability || ''}
                onChange={(e) => updateTodo('desired_usability', e.target.value)}
              />
              <Select
                label="Priority"
                options={priorityOptions}
                value={todo.priority || ''}
                onChange={(e) => updateTodo('priority', e.target.value || undefined)}
              />
            </>
          )}

          {item.type === 'trip' && (
            <>
              <Input
                label="Destination"
                placeholder="Where to?"
                value={todo.destination || ''}
                onChange={(e) => updateTodo('destination', e.target.value)}
                required
              />
              <Input
                label="Companions"
                placeholder="Who with?"
                value={todo.companions || ''}
                onChange={(e) => updateTodo('companions', e.target.value)}
              />
              <Input
                label="Date"
                type="date"
                value={todo.date || ''}
                onChange={(e) => updateTodo('date', e.target.value)}
              />
              <Input
                label="Duration"
                placeholder="e.g. 3 days"
                value={todo.duration || ''}
                onChange={(e) => updateTodo('duration', e.target.value)}
              />
              <Textarea
                label="Photo Goals"
                placeholder="What photos do you want to capture?"
                value={todo.photo_goals || ''}
                onChange={(e) => updateTodo('photo_goals', e.target.value)}
              />
              <Select
                label="Priority"
                options={priorityOptions}
                value={todo.priority || ''}
                onChange={(e) => updateTodo('priority', e.target.value || undefined)}
              />
            </>
          )}
        </div>
      </Card>

      {/* Process/Memo fields */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Process / Memo Details
        </h3>

        <div className="space-y-4">
          {item.type === 'task' && (
            <>
              <Input
                label="Category"
                placeholder="Category for memo"
                value={pm.category || ''}
                onChange={(e) => updateProcessMemo('category', e.target.value)}
              />
              <Textarea
                label="Problem"
                placeholder="What problem did you solve?"
                value={pm.problem || ''}
                onChange={(e) => updateProcessMemo('problem', e.target.value)}
              />
              <Textarea
                label="Experience"
                placeholder="What was your experience?"
                value={pm.experience || ''}
                onChange={(e) => updateProcessMemo('experience', e.target.value)}
              />
              <Textarea
                label="Note"
                placeholder="Additional notes..."
                value={pm.note || ''}
                onChange={(e) => updateProcessMemo('note', e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Photo
                </label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload('photo')}
                  className="text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 dark:hover:file:bg-slate-700"
                />
                {pm.photo && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={pm.photo}
                      alt="Preview"
                      className="rounded-lg max-h-32 object-cover border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {item.type === 'task-it-infra' && (
            <>
              <Input
                label="Category"
                placeholder="Category for memo"
                value={pm.category || ''}
                onChange={(e) => updateProcessMemo('category', e.target.value)}
              />
              <Select
                label="Infrastructure Type"
                options={infraOptions}
                value={pm.infra || 'server'}
                onChange={(e) => updateProcessMemo('infra', e.target.value as InfraType)}
              />
              <Input
                label="Item"
                placeholder="Server name / device"
                value={pm.item || ''}
                onChange={(e) => updateProcessMemo('item', e.target.value)}
              />
              <Input
                label="Kind"
                placeholder="Type of resource / service"
                value={pm.kind || ''}
                onChange={(e) => updateProcessMemo('kind', e.target.value)}
              />
              <Textarea
                label="Description"
                placeholder="Describe what this is for..."
                value={pm.description || ''}
                onChange={(e) => updateProcessMemo('description', e.target.value)}
              />
              <Input
                label="URL / IP"
                placeholder="https://... or IP address"
                value={pm.url_ip || ''}
                onChange={(e) => updateProcessMemo('url_ip', e.target.value)}
              />
              <Input
                label="Username"
                placeholder="Login username"
                value={pm.username || ''}
                onChange={(e) => updateProcessMemo('username', e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Current password"
                value={pm.password || ''}
                onChange={(e) => updateProcessMemo('password', e.target.value)}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Updated password"
                value={pm.new_password || ''}
                onChange={(e) => updateProcessMemo('new_password', e.target.value)}
              />
              <Textarea
                label="Remark"
                placeholder="Additional remarks..."
                value={pm.remark || ''}
                onChange={(e) => updateProcessMemo('remark', e.target.value)}
              />
            </>
          )}

          {item.type === 'reading-book' && (
            <>
              <Input
                label="Book Name"
                placeholder="Full book name"
                value={pm.book_name || ''}
                onChange={(e) => updateProcessMemo('book_name', e.target.value)}
              />
              <Textarea
                label="Event"
                placeholder="What event / context led to reading this?"
                value={pm.event || ''}
                onChange={(e) => updateProcessMemo('event', e.target.value)}
              />
              <Textarea
                label="Knowledge"
                placeholder="What did you learn?"
                value={pm.knowledge || ''}
                onChange={(e) => updateProcessMemo('knowledge', e.target.value)}
              />
              <Textarea
                label="Notes (Markdown)"
                placeholder="Your notes in markdown..."
                value={pm.note || ''}
                onChange={(e) => updateProcessMemo('note', e.target.value)}
                rows={5}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  PDF Upload
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => updateProcessMemo('book_pdf', reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                  className="text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 dark:hover:file:bg-slate-700"
                />
              </div>
            </>
          )}

          {item.type === 'reading-website' && (
            <>
              <Input
                label="Website Name"
                placeholder="Name of the website"
                value={pm.website_name || ''}
                onChange={(e) => updateProcessMemo('website_name', e.target.value)}
              />
              <Textarea
                label="Event"
                placeholder="What led you to this site?"
                value={pm.event || ''}
                onChange={(e) => updateProcessMemo('event', e.target.value)}
              />
              <Textarea
                label="Knowledge"
                placeholder="What did you learn?"
                value={pm.knowledge || ''}
                onChange={(e) => updateProcessMemo('knowledge', e.target.value)}
              />
              <Textarea
                label="Notes (Markdown)"
                placeholder="Your notes in markdown..."
                value={pm.note || ''}
                onChange={(e) => updateProcessMemo('note', e.target.value)}
                rows={5}
              />
            </>
          )}

          {item.type === 'buying' && (
            <>
              <Input
                label="Category"
                placeholder="Category"
                value={pm.category || ''}
                onChange={(e) => updateProcessMemo('category', e.target.value)}
              />
              <Input
                label="Price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={pm.price || ''}
                onChange={(e) => updateProcessMemo('price', parseFloat(e.target.value) || 0)}
              />
              <Textarea
                label="Usable Where"
                placeholder="Where can this be used?"
                value={pm.usable_where || ''}
                onChange={(e) => updateProcessMemo('usable_where', e.target.value)}
              />
            </>
          )}

          {item.type === 'trip' && (
            <>
              <Input
                label="Destination"
                placeholder="Destination"
                value={pm.destination || ''}
                onChange={(e) => updateProcessMemo('destination', e.target.value)}
              />
              <Input
                label="Companions"
                placeholder="Who with?"
                value={pm.companions || ''}
                onChange={(e) => updateProcessMemo('companions', e.target.value)}
              />
              <Input
                label="Date"
                type="date"
                value={pm.date || ''}
                onChange={(e) => updateProcessMemo('date', e.target.value)}
              />
              <Input
                label="Duration"
                placeholder="e.g. 3 days"
                value={pm.duration || ''}
                onChange={(e) => updateProcessMemo('duration', e.target.value)}
              />
              <Textarea
                label="Experience"
                placeholder="How was the trip?"
                value={pm.experience || ''}
                onChange={(e) => updateProcessMemo('experience', e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Photo (9:16 aspect ratio recommended)
                </label>
                <div className="flex gap-3 items-start">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload('photo')}
                    className="text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 dark:hover:file:bg-slate-700"
                  />
                </div>
                {pm.photo && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={pm.photo}
                      alt="Preview"
                      className="rounded-lg max-h-48 object-cover border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                )}
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  9:16 portrait orientation ideal for trip photos
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3 sticky bottom-4">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? 'Save Changes' : 'Create Item'}
        </Button>
      </div>
    </form>
  );
}
