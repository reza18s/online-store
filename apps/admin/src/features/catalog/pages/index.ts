export type {
  AdminCatalogInventoryView,
  AdminMutationState,
  ProductDraftValues,
} from '@/features/catalog/pages/admin-catalog-inventory-page-shared';
export {
  catalogKeyPattern,
  faDate,
  faNumber,
  productSlugPattern,
} from '@/features/catalog/pages/admin-catalog-inventory-page-shared';
export { normalizeAdminCatalogInventoryView } from '@/features/catalog/components/catalog-inventory/normalize-admin-catalog-inventory-view';
export { adminProductEditorKey } from '@/features/catalog/components/catalog-inventory/admin-product-editor-key';
export { adminProductStatusAction } from '@/features/catalog/components/catalog-inventory/admin-product-status-action';
export { adminInventoryViewKey } from '@/features/catalog/components/catalog-inventory/admin-inventory-view-key';
export { pageCount } from '@/features/catalog/components/catalog-inventory/page-count';
export { hasAdminRole } from '@/features/catalog/components/catalog-inventory/has-admin-role';
export { validateProductDraft } from '@/features/catalog/components/catalog-inventory/validate-product-draft';
export { validateInventoryAdjustment } from '@/features/catalog/components/catalog-inventory/validate-inventory-adjustment';
export { validateMediaDraft } from '@/features/catalog/components/catalog-inventory/validate-media-draft';
export { resolveAdminMutationState } from '@/features/catalog/components/catalog-inventory/resolve-admin-mutation-state';
export { isInventoryDiscrepancy } from '@/features/catalog/components/catalog-inventory/is-inventory-discrepancy';
export { resolveInventoryDetailState } from '@/features/catalog/components/catalog-inventory/resolve-inventory-detail-state';
export { adminCatalogInventoryErrorMessage } from '@/features/catalog/components/catalog-inventory/admin-catalog-inventory-error-message';
export { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';
export { formatToman } from '@/shared/utils/format-toman';
export { formatDate } from '@/features/catalog/components/catalog-inventory/format-date';
export { ltr } from '@/features/catalog/components/catalog-inventory/ltr';
export { isOfflineError } from '@/features/catalog/components/catalog-inventory/is-offline-error';
export { statusLabel } from '@/features/catalog/components/catalog-inventory/status-label';
export { statusBadgeVariant } from '@/features/catalog/components/catalog-inventory/status-badge-variant';
export { StatusBadge } from '@/features/catalog/components/catalog-inventory/status-badge';
export { MutationStateBadge } from '@/features/catalog/components/catalog-inventory/mutation-state-badge';
export { StatePanel } from '@/features/catalog/components/catalog-inventory/state-panel';
export { LoadingState } from '@/features/catalog/components/catalog-inventory/loading-state';
export { QueryState } from '@/features/catalog/components/catalog-inventory/query-state';
export { PermissionPanel } from '@/features/catalog/components/catalog-inventory/permission-panel';
export { AdminSessionState } from '@/features/catalog/components/catalog-inventory/admin-session-state';
export { AdminOperationsShell } from '@/features/catalog/components/catalog-inventory/admin-operations-shell';
export { FilterInput } from '@/features/catalog/components/catalog-inventory/filter-input';
export { Pagination } from '@/features/catalog/components/catalog-inventory/pagination';
export { CatalogView } from '@/features/catalog/components/catalog-inventory/catalog-view';
export { ProductTableRow } from '@/features/catalog/components/catalog-inventory/product-table-row';
export { ProductCard } from '@/features/catalog/components/catalog-inventory/product-card';
export { MediaThumb } from '@/features/catalog/components/catalog-inventory/media-thumb';
export { LowStockCard } from '@/features/catalog/components/catalog-inventory/low-stock-card';
export { CategoriesView } from '@/features/catalog/components/catalog-inventory/categories-view';
export { CategoryRow } from '@/features/catalog/components/catalog-inventory/category-row';
export { InventoryView } from '@/features/catalog/components/catalog-inventory/inventory-view';
export { InventoryRow } from '@/features/catalog/components/catalog-inventory/inventory-row';
export { InventoryDetail } from '@/features/catalog/components/catalog-inventory/inventory-detail';
export { ProductEditor } from '@/features/catalog/components/catalog-inventory/product-editor';
export { mutationStateLabel } from '@/features/catalog/components/catalog-inventory/mutation-state-label';
export { TaxonomyPanel } from '@/features/catalog/components/catalog-inventory/taxonomy-panel';
export { OptionsPanel } from '@/features/catalog/components/catalog-inventory/options-panel';
export { OptionItem } from '@/features/catalog/components/catalog-inventory/option-item';
export { OptionValue } from '@/features/catalog/components/catalog-inventory/option-value';
export { VariantsPanel } from '@/features/catalog/components/catalog-inventory/variants-panel';
export { VariantItem } from '@/features/catalog/components/catalog-inventory/variant-item';
export { MediaPanel } from '@/features/catalog/components/catalog-inventory/media-panel';
export { MediaItem } from '@/features/catalog/components/catalog-inventory/media-item';
export { canDeleteAdminProductMedia } from '@/features/catalog/components/catalog-inventory/can-delete-admin-product-media';
export { buildAdminCatalogProductUpdateInput } from '@/features/catalog/components/catalog-inventory/build-admin-catalog-product-update-input';
export {
  CatalogInventoryView,
  CatalogInventoryView as AdminCatalogInventoryPage,
} from '@/features/catalog/components/catalog-inventory/CatalogInventoryView';
