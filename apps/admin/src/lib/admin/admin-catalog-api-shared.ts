import { type AdminCatalogProductListItem, type AdminCatalogProductPage } from '@nova/api-client';

export interface AdminCatalogProductListResult extends AdminCatalogProductPage {
  items: AdminCatalogProductListItem[];
}

export const staffAuthCsrfPath = '/v1/staff/auth/csrf';
