import type {
  AdminCatalogProductListQuery,
  AdminAuditListQuery,
  AdminInventoryListQuery,
  AdminCouponListQuery,
  AdminCustomerListQuery,
  AdminNotificationListQuery,
  AdminOrderListQuery,
  AdminPaymentListQuery,
  CatalogFacetQuery,
  CatalogProductQuery,
  CheckoutRequestInput,
  CustomerOrderListQuery,
  AdminRedirectListQuery,
  AdminSeoMetadataListQuery,
  AdminContentPageListQuery,
} from './types';

export const queryKeys = {
  health: {
    live: () => ['health', 'live'] as const,
    ready: () => ['health', 'ready'] as const,
  },
  staffAuth: {
    current: () => ['staff-auth', 'current'] as const,
  },
  catalog: {
    all: ['catalog'] as const,
    categories: () => ['catalog', 'categories'] as const,
    products: (filters: Partial<CatalogProductQuery> = {}) =>
      ['catalog', 'products', filters] as const,
    search: (filters: Partial<CatalogProductQuery> = {}) => ['catalog', 'search', filters] as const,
    suggestions: (query: string, limit = 8) =>
      ['catalog', 'suggestions', { query, limit }] as const,
    facets: (filters: CatalogFacetQuery = {}) => ['catalog', 'facets', filters] as const,
    product: (slug: string) => ['catalog', 'product', slug] as const,
  },
  seo: {
    all: ['seo'] as const,
    resolve: (path: string) => ['seo', 'resolve', path] as const,
  },
  content: {
    all: ['content'] as const,
    page: (slug: string) => ['content', 'page', slug] as const,
  },
  adminCatalog: {
    all: ['admin', 'catalog'] as const,
    products: (filters: AdminCatalogProductListQuery = {}) =>
      ['admin', 'catalog', 'products', filters] as const,
    product: (productId: string) => ['admin', 'catalog', 'product', productId] as const,
    categories: () => ['admin', 'catalog', 'categories'] as const,
    productCategories: (productId: string) =>
      ['admin', 'catalog', 'product-categories', productId] as const,
    productOptions: (productId: string) =>
      ['admin', 'catalog', 'product-options', productId] as const,
    productVariants: (productId: string) =>
      ['admin', 'catalog', 'product-variants', productId] as const,
    productMedia: (productId: string) => ['admin', 'catalog', 'product-media', productId] as const,
  },
  adminInventory: {
    all: ['admin', 'inventory'] as const,
    items: (filters: AdminInventoryListQuery = {}) =>
      ['admin', 'inventory', 'items', filters] as const,
    item: (variantId: string) => ['admin', 'inventory', 'item', variantId] as const,
  },
  adminOrders: {
    all: ['admin', 'orders'] as const,
    list: (filters: AdminOrderListQuery = {}) => ['admin', 'orders', 'list', filters] as const,
    detail: (orderNumber: string) => ['admin', 'orders', 'detail', orderNumber] as const,
  },
  adminAudit: {
    all: ['admin', 'audit'] as const,
    events: (filters: AdminAuditListQuery = {}) => ['admin', 'audit', 'events', filters] as const,
  },
  adminPayments: {
    all: ['admin', 'payments'] as const,
    list: (filters: AdminPaymentListQuery = {}) => ['admin', 'payments', 'list', filters] as const,
    detail: (paymentAttemptId: string) =>
      ['admin', 'payments', 'detail', paymentAttemptId] as const,
  },
  adminCoupons: {
    all: ['admin', 'coupons'] as const,
    list: (filters: AdminCouponListQuery = {}) => ['admin', 'coupons', 'list', filters] as const,
  },
  adminCustomers: {
    all: ['admin', 'customers'] as const,
    list: (filters: AdminCustomerListQuery = {}) =>
      ['admin', 'customers', 'list', filters] as const,
  },
  adminNotifications: {
    all: ['admin', 'notifications'] as const,
    list: (filters: AdminNotificationListQuery = {}) =>
      ['admin', 'notifications', 'list', filters] as const,
  },
  adminContent: {
    all: ['admin', 'content'] as const,
    pages: (filters: AdminContentPageListQuery = {}) =>
      ['admin', 'content', 'pages', filters] as const,
    page: (pageId: string) => ['admin', 'content', 'page', pageId] as const,
    seoMetadata: (filters: AdminSeoMetadataListQuery = {}) =>
      ['admin', 'content', 'seo-metadata', filters] as const,
    redirects: (filters: AdminRedirectListQuery = {}) =>
      ['admin', 'content', 'redirects', filters] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: (filters: CustomerOrderListQuery = {}) => ['orders', 'list', filters] as const,
    detail: (orderNumber: string) => ['orders', orderNumber] as const,
  },
  account: {
    current: () => ['account', 'current'] as const,
    addresses: () => ['account', 'addresses'] as const,
  },
  checkout: {
    all: ['checkout'] as const,
    quote: (input: CheckoutRequestInput) => ['checkout', 'quote', input] as const,
  },
  cart: {
    current: () => ['cart', 'current'] as const,
  },
} as const;
