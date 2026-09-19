export type AdminCatalogInventoryView = 'catalog' | 'categories' | 'inventory' | 'product';

export type AdminMutationState = 'draft' | 'invalid' | 'saving' | 'saved' | 'publish-blocked';

export interface ProductDraftValues {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  brand: string;
  basePriceToman: string;
  compareAtPriceToman: string;
}

export const faNumber = new Intl.NumberFormat('fa-IR');

export const faDate = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' });

export const productSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const catalogKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
