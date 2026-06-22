/**
 * API layer — re-exports from the real client.
 * Legacy mock code removed; all calls now hit the Express backend.
 */
export {
  fetchItems,
  fetchItem,
  createItem,
  updateItem,
  deleteItem,
  moveItemStatus,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchStats,
} from './client';
