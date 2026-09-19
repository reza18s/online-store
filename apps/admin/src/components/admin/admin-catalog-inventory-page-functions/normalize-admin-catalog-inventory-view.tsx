import type { AdminCatalogInventoryView } from '../../../pages/admin/admin-catalog-inventory-page-shared';

export function normalizeAdminCatalogInventoryView(value?: string): AdminCatalogInventoryView {
  if (value === 'categories' || value === 'inventory' || value === 'product') return value;
  return 'catalog';
}
