import { useStaffUser } from '@/features/auth';

import { isStaffAuthFailure, isStaffAuthorizationFailure } from '@/features/auth/api/admin-auth';

import { AdminOperationsShell } from '@/features/catalog/components/catalog-inventory/admin-operations-shell';

import { AdminSessionState } from '@/features/catalog/components/catalog-inventory/admin-session-state';

import { CatalogView } from '@/features/catalog/components/catalog-inventory/catalog-view';

import { CategoriesView } from '@/features/catalog/components/catalog-inventory/categories-view';

import { InventoryView } from '@/features/catalog/components/catalog-inventory/inventory-view';

import { ProductEditor } from '@/features/catalog/components/catalog-inventory/product-editor';

import { adminInventoryViewKey } from '@/features/catalog/components/catalog-inventory/admin-inventory-view-key';

import { adminProductEditorKey } from '@/features/catalog/components/catalog-inventory/admin-product-editor-key';

import { hasAdminRole } from '@/features/catalog/components/catalog-inventory/has-admin-role';

import { normalizeAdminCatalogInventoryView } from '@/features/catalog/components/catalog-inventory/normalize-admin-catalog-inventory-view';

export function CatalogInventoryView({
  view,
  productId,
  variantId,
  staffRoles,
}: {
  view?: string;
  productId?: string;
  variantId?: string;
  staffRoles?: readonly string[];
}) {
  const activeView = normalizeAdminCatalogInventoryView(
    view ?? (variantId ? 'inventory' : productId ? 'product' : undefined),
  );
  const staffQuery = useStaffUser(staffRoles === undefined);
  if (staffQuery.isPending) return <AdminSessionState kind="loading" />;
  if (isStaffAuthFailure(staffQuery.error)) return <AdminSessionState kind="expired" />;
  if (isStaffAuthorizationFailure(staffQuery.error)) return <AdminSessionState kind="denied" />;
  if (staffRoles === undefined && !staffQuery.data) return <AdminSessionState kind="missing" />;
  const roles = staffRoles ?? staffQuery.data?.roles ?? [];
  const canView = hasAdminRole(roles, ['support', 'operations', 'admin']);
  if (!canView) return <AdminSessionState kind="denied" />;
  return (
    <AdminOperationsShell roles={roles} view={activeView}>
      {activeView === 'catalog' ? (
        <CatalogView roles={roles} />
      ) : activeView === 'categories' ? (
        <CategoriesView roles={roles} />
      ) : activeView === 'inventory' ? (
        <InventoryView
          key={adminInventoryViewKey(variantId)}
          initialVariantId={variantId}
          roles={roles}
        />
      ) : (
        <ProductEditor key={adminProductEditorKey(productId)} productId={productId} roles={roles} />
      )}
    </AdminOperationsShell>
  );
}
