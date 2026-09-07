export const queryKeys = {
  health: {
    live: () => ['health', 'live'] as const,
    ready: () => ['health', 'ready'] as const,
  },
  catalog: {
    all: ['catalog'] as const,
    categories: () => ['catalog', 'categories'] as const,
    products: (filters: Record<string, string | number | boolean | undefined> = {}) =>
      ['catalog', 'products', filters] as const,
    product: (slug: string) => ['catalog', 'product', slug] as const,
  },
  orders: {
    all: ['orders'] as const,
    detail: (orderNumber: string) => ['orders', orderNumber] as const,
  },
  account: {
    current: () => ['account', 'current'] as const,
  },
} as const;
