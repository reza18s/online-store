import type { Page, Route } from '@playwright/test';
import type {
  AdminCatalogProductPage,
  AdminCatalogCategory,
} from '../../../packages/api-client/src/types';

const meta = { requestId: 'route-sweep-fixture', timestamp: '2026-01-01T00:00:00.000Z' };
const product: AdminCatalogProductPage['items'][number] = {
  id: 'route-sweep-product',
  slug: 'route-sweep-product',
  name: 'محصول تست مسیر',
  status: 'PUBLISHED',
  publishedAt: meta.timestamp,
  archivedAt: null,
  basePriceToman: 1250000,
  compareAtPriceToman: null,
  categories: [],
  primaryMedia: {
    url: '/assets/nova-product-oxford-shirt.webp',
    altText: 'پیراهن مردانه روشن، داده آزمایشی مرورگر',
  },
  inventory: {
    available: 7,
    lowStockVariantCount: 0,
    outOfStockVariantCount: 0,
    status: 'IN_STOCK',
  },
  variantCount: 1,
  mediaCount: 0,
  createdAt: meta.timestamp,
  updatedAt: meta.timestamp,
};
const catalogProducts: AdminCatalogProductPage['items'] = [
  product,
  {
    ...product,
    id: 'route-sweep-knit-cardigan',
    slug: 'route-sweep-knit-cardigan',
    name: 'ژاکت بافت یقه‌گرد',
    basePriceToman: 2190000,
    primaryMedia: {
      url: '/assets/nova-product-knit-cardigan.webp',
      altText: 'ژاکت بافت قهوه‌ای، داده آزمایشی مرورگر',
    },
    inventory: {
      available: 4,
      lowStockVariantCount: 0,
      outOfStockVariantCount: 0,
      status: 'IN_STOCK',
    },
  },
  {
    ...product,
    id: 'route-sweep-soft-trousers',
    slug: 'route-sweep-soft-trousers',
    name: 'شلوار کتان راحت',
    basePriceToman: 1890000,
    primaryMedia: {
      url: '/assets/nova-product-soft-trousers.webp',
      altText: 'شلوار کتان روشن، داده آزمایشی مرورگر',
    },
    inventory: {
      available: 2,
      lowStockVariantCount: 1,
      outOfStockVariantCount: 0,
      status: 'LOW_STOCK',
    },
  },
  {
    ...product,
    id: 'route-sweep-linen-overshirt',
    slug: 'route-sweep-linen-overshirt',
    name: 'پیراهن لینن',
    basePriceToman: 2450000,
    primaryMedia: {
      url: '/assets/nova-product-linen-overshirt.webp',
      altText: 'پیراهن لینن، داده آزمایشی مرورگر',
    },
    inventory: {
      available: 0,
      lowStockVariantCount: 0,
      outOfStockVariantCount: 1,
      status: 'OUT_OF_STOCK',
    },
  },
  {
    ...product,
    id: 'route-sweep-textured-scarf',
    slug: 'route-sweep-textured-scarf',
    name: 'شال بافت‌دار',
    basePriceToman: 890000,
    primaryMedia: {
      url: '/assets/nova-product-textured-scarf.webp',
      altText: 'شال بافت‌دار، داده آزمایشی مرورگر',
    },
  },
  {
    ...product,
    id: 'route-sweep-kids-set',
    slug: 'route-sweep-kids-set',
    name: 'ست لباس کودک',
    basePriceToman: 1790000,
    primaryMedia: {
      url: '/assets/nova-product-kids-set.webp',
      altText: 'ست لباس کودک، داده آزمایشی مرورگر',
    },
  },
];
const category: AdminCatalogCategory = {
  id: 'route-sweep-category',
  slug: 'route-sweep-category',
  name: 'دسته تست مسیر',
  description: 'fixture',
  parentId: null,
  archivedAt: null,
  productCount: 1,
  childCount: 0,
  createdAt: meta.timestamp,
  updatedAt: meta.timestamp,
};
const order = {
  orderId: 'route-sweep-order-id',
  orderNumber: 'ROUTE-SWEEP-ORDER',
  status: 'CONFIRMED',
  paymentStatus: 'PAID',
  subtotalToman: 100000,
  discountToman: 0,
  shippingToman: 0,
  taxToman: 0,
  totalToman: 100000,
  currency: 'TOMAN',
  createdAt: meta.timestamp,
  updatedAt: meta.timestamp,
  customer: {
    id: 'route-sweep-customer',
    phone: '+989000000001',
    email: 'route-sweep@example.test',
    status: 'ACTIVE',
  },
  shipmentStatus: 'PENDING',
  trackingReference: null,
};
const envelope = (data: unknown) => JSON.stringify({ data, meta });

export async function installAdminRouteFixtures(page: Page) {
  const unexpectedRequests: string[] = [];
  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return route.abort();
    if (request.method() !== 'GET' && request.method() !== 'HEAD') return route.abort();
    if (url.pathname === '/v1/staff/auth/me')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          id: 'route-sweep-staff',
          email: 'route-sweep@browser.local',
          status: 'ACTIVE',
          roles: ['admin', 'operations', 'support'],
        }),
      });
    if (url.pathname === '/v1/admin/dashboard/summary')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          publishedProductCount: 42,
          newCustomerCount: 17,
          newOrderCount: 9,
          paidGrossToman: 123456000,
          successfulRefundToman: 789000,
          orderStatusCounts: { CONFIRMED: 3, SHIPPED: 2 },
        }),
      });
    if (url.pathname === '/v1/admin/catalog/products')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          items: catalogProducts,
          total: catalogProducts.length,
          page: 1,
          limit: 8,
        }),
      });
    if (url.pathname.startsWith('/v1/admin/catalog/products/')) {
      const resource = url.pathname.split('/').at(-1);
      const data =
        resource === product.id
          ? {
              ...product,
              brand: 'NOVA',
              description: 'توضیح تست مسیر',
              shortDescription: 'خلاصه تست مسیر',
            }
          : resource === 'categories'
            ? [category]
            : [];
      return route.fulfill({ status: 200, contentType: 'application/json', body: envelope(data) });
    }
    if (url.pathname === '/v1/admin/catalog/categories')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([category]),
      });
    if (url.pathname === '/v1/admin/inventory/items')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          items: [
            {
              id: 'route-sweep-inventory',
              variantId: 'route-sweep-variant',
              productId: product.id,
              productSlug: product.slug,
              productName: product.name,
              productStatus: 'PUBLISHED',
              sku: 'ROUTE-SWEEP-SKU',
              variantTitle: 'نسخه تست',
              isActive: true,
              onHand: 4,
              reserved: 1,
              available: 3,
              reorderPoint: 1,
              stockStatus: 'IN_STOCK',
              updatedAt: meta.timestamp,
              recentMovements: [],
            },
          ],
          total: 1,
          page: 1,
          limit: 4,
        }),
      });
    if (url.pathname.startsWith('/v1/admin/inventory/'))
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          id: 'route-sweep-variant',
          variantId: 'route-sweep-variant',
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          productStatus: 'PUBLISHED',
          sku: 'ROUTE-SWEEP-SKU',
          variantTitle: 'نسخه تست',
          isActive: true,
          onHand: 4,
          reserved: 1,
          available: 3,
          reorderPoint: 1,
          stockStatus: 'IN_STOCK',
          updatedAt: meta.timestamp,
          recentMovements: [],
        }),
      });
    if (url.pathname === '/v1/admin/orders')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ items: [order], total: 1, page: 1, limit: 10 }),
      });
    if (url.pathname.startsWith('/v1/admin/orders/'))
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          ...order,
          items: [],
          address: null,
          payment: null,
          shipment: null,
          events: [],
          refunds: [],
          returnRequest: null,
        }),
      });
    if (url.pathname === '/v1/admin/content/pages')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          items: [
            {
              id: 'route-sweep-page',
              slug: 'route-sweep-page',
              title: 'صفحه تست مسیر',
              status: 'DRAFT',
              createdAt: meta.timestamp,
              updatedAt: meta.timestamp,
              body: 'متن تست مسیر',
              blocks: [],
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        }),
      });
    if (url.pathname.startsWith('/v1/admin/content/pages/'))
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          id: 'route-sweep-page',
          slug: 'route-sweep-page',
          title: 'صفحه تست مسیر',
          status: 'DRAFT',
          createdAt: meta.timestamp,
          updatedAt: meta.timestamp,
          body: 'متن تست مسیر',
          blocks: [],
        }),
      });
    if (url.pathname.startsWith('/v1/admin/'))
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ items: [], total: 0, page: 1, limit: 12 }),
      });
    if (url.pathname.startsWith('/v1/')) {
      unexpectedRequests.push(`${request.method()} ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  return unexpectedRequests;
}
