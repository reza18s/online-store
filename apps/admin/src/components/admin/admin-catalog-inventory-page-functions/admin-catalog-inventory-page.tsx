import { useStaffUser } from '../../../lib/admin/admin-catalog-api';

import { isStaffAuthFailure, isStaffAuthorizationFailure } from '../../../lib/admin/admin-auth';

import { AdminOperationsShell } from './admin-operations-shell';

import { AdminSessionState } from './admin-session-state';

import { CatalogView } from './catalog-view';

import { CategoriesView } from './categories-view';

import { InventoryView } from './inventory-view';

import { ProductEditor } from './product-editor';

import { adminInventoryViewKey } from './admin-inventory-view-key';

import { adminProductEditorKey } from './admin-product-editor-key';

import { hasAdminRole } from './has-admin-role';

import { normalizeAdminCatalogInventoryView } from './normalize-admin-catalog-inventory-view';

export function AdminCatalogInventoryPage({
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
