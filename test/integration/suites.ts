export interface CommerceIntegrationSuite {
  readonly id: string;
  readonly label: string;
  readonly files: readonly string[];
  readonly capabilities: readonly string[];
}

/**
 * The suite manifest is deliberately explicit. A test added to this harness
 * must name the production boundary it exercises so the command output cannot
 * be mistaken for a blanket end-to-end claim.
 */
export const commerceIntegrationSuites: readonly CommerceIntegrationSuite[] = [
  {
    id: 'catalog',
    label: 'catalog, search normalization, suggestions, and contextual facets',
    files: ['apps/api/src/modules/catalog/catalog.test.ts'],
    capabilities: ['catalog', 'search', 'facets', 'price metadata safety'],
  },
  {
    id: 'cart',
    label: 'cart pricing, mutation idempotency, ownership, and guest merge',
    files: [
      'apps/api/src/modules/cart/cart.test.ts',
      'apps/api/src/modules/cart/customer-cart.test.ts',
    ],
    capabilities: ['cart', 'cart mutation duplicate replay', 'cart merge conflict'],
  },
  {
    id: 'checkout-inventory',
    label: 'authoritative checkout quotes, idempotent order intent, and reservations',
    files: [
      'apps/api/src/modules/checkout/checkout.test.ts',
      'apps/api/src/modules/inventory/inventory.test.ts',
    ],
    capabilities: [
      'checkout idempotency',
      'checkout price conflict',
      'checkout stock conflict',
      'reservation race/settlement transitions',
    ],
  },
  {
    id: 'orders',
    label: 'customer order reads, cancellation/returns, and fulfillment transitions',
    files: [
      'apps/api/src/modules/orders/orders.test.ts',
      'apps/api/src/modules/orders/orders-actions.test.ts',
      'apps/api/src/modules/orders/orders-fulfillment.test.ts',
      'apps/api/src/modules/orders/orders-admin.test.ts',
    ],
    capabilities: ['order transitions', 'cancellation', 'returns', 'staff role boundary'],
  },
  {
    id: 'payments',
    label: 'payment callback replay/reconciliation and refund outcomes',
    files: [
      'apps/api/src/modules/payments/payment.service.test.ts',
      'apps/api/src/modules/payments/payment.refund.test.ts',
      'apps/api/src/modules/payments/payment-admin.test.ts',
    ],
    capabilities: [
      'payment success',
      'payment failure',
      'payment duplicate callback',
      'late callback and stock reacquisition',
      'refund success/failure/duplicate',
    ],
  },
  {
    id: 'auth-http',
    label: 'customer/staff authentication, sessions, roles, and CSRF',
    files: [
      'apps/api/src/modules/auth/auth.test.ts',
      'apps/api/src/modules/staff-auth/staff-auth.test.ts',
      'apps/api/src/common/http/csrf.guard.test.ts',
    ],
    capabilities: ['customer auth', 'staff auth', 'role authorization', 'CSRF rejection'],
  },
  {
    id: 'notifications',
    label: 'notification outbox dedupe, redacted inspection, and worker retry leasing',
    files: [
      'apps/api/src/modules/notifications/notification.service.test.ts',
      'apps/api/src/modules/notifications/notification-admin.test.ts',
      'apps/worker/src/notification-worker.test.ts',
    ],
    capabilities: ['notification dedupe', 'notification delivery retry', 'notification failure'],
  },
  {
    id: 'web-transport',
    label: 'browser transport paths, CSRF-aware client behavior, and query contracts',
    files: [
      'packages/api-client/src/client.test.ts',
      'apps/web/src/features/auth/auth-api.test.ts',
      'apps/web/src/features/cart/cart-api.test.ts',
      'apps/web/src/features/catalog/catalog-api.test.ts',
      'apps/web/src/features/checkout/checkout-api.test.ts',
      'apps/web/src/features/orders/orders-api.test.ts',
      'apps/web/src/features/addresses/addresses-api.test.ts',
      'apps/web/src/features/content/content-api.test.ts',
      'apps/web/src/features/admin/admin-catalog-api.test.ts',
      'apps/web/src/features/admin/admin-inventory-api.test.ts',
      'apps/web/src/features/admin/admin-orders-api.test.ts',
      'apps/web/src/features/admin/admin-payments-api.test.ts',
      'apps/web/src/features/admin/admin-notifications-api.test.ts',
      'apps/web/src/features/admin/admin-audit-api.test.ts',
      'apps/web/src/features/admin/admin-customers-api.test.ts',
      'apps/web/src/features/admin/admin-coupons-api.test.ts',
    ],
    capabilities: ['web/API transport', 'browser CSRF header mirroring', 'admin transport paths'],
  },
];

export const unavailableRuntimeCoverage: readonly string[] = [
  'PostgreSQL-backed integration against the exact postgres:16-alpine service',
  'Redis-backed OTP state and worker runtime against the exact redis:7-alpine service',
  'real SMS, payment, shipping, and notification providers',
  'authenticated browser journeys requiring user-controlled OTP, CAPTCHA, or SMS data',
];
