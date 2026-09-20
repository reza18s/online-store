import { type AdminCatalogProductListItem, type AdminCatalogProductPage } from '@nova/api-client';

export interface AdminCatalogProductListResult extends AdminCatalogProductPage {
  items: AdminCatalogProductListItem[];
}
