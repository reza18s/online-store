interface CommerceIntegrationSuiteMetadata {
  readonly id: string;
  readonly label: string;
  readonly capabilities: readonly string[];
}

export type CommerceIntegrationSuite = CommerceIntegrationSuiteMetadata &
  (
    | { readonly files: readonly string[]; readonly testGroups?: never }
    | { readonly files?: never; readonly testGroups: readonly IntegrationTestGroup[] }
  );

export interface IntegrationTestGroup {
  readonly cwd: string;
  readonly files: readonly string[];
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
    label: 'authoritative checkout quotes, idempotent order intent, and sequential reservations',
    files: [
      'apps/api/src/modules/checkout/checkout.test.ts',
      'apps/api/src/modules/inventory/inventory.test.ts',
    ],
    capabilities: [
      'checkout idempotency',
      'checkout price conflict',
      'checkout stock conflict',
      'sequential reservation conflict and settlement transitions',
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
    id: 'auth-service-boundaries',
    label: 'customer/staff auth service boundaries and direct CSRF guard behavior',
    files: [
      'apps/api/src/modules/auth/auth.test.ts',
      'apps/api/src/modules/staff-auth/staff-auth.test.ts',
      'apps/api/src/common/http/csrf.guard.test.ts',
    ],
    capabilities: [
      'customer auth service',
      'staff auth service',
      'session and role policy',
      'direct CSRF guard checks',
    ],
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
    testGroups: [
      {
        cwd: 'packages/api-client',
        files: ['src/client.test.ts'],
      },
      {
        cwd: 'apps/web',
        files: [
          'src/features/auth/api/auth-api.test.ts',
          'src/features/cart/api/cart-api.test.ts',
          'src/features/catalog/api/catalog-api.test.ts',
          'src/features/checkout/api/checkout-api.test.ts',
          'src/features/orders/api/orders-api.test.ts',
          'src/features/account/api/addresses-api.test.ts',
          'src/features/content/api/content-api.test.ts',
        ],
      },
      {
        cwd: 'apps/admin',
        files: [
          'src/features/catalog/api/catalog/admin-catalog-api.test.ts',
          'src/features/catalog/api/inventory/admin-inventory-api.test.ts',
          'src/features/orders/api/admin-orders-api.test.ts',
          'src/features/support/api/payments/admin-payments-api.test.ts',
          'src/features/support/api/notifications/admin-notifications-api.test.ts',
          'src/features/support/api/audit/admin-audit-api.test.ts',
          'src/features/support/api/customers/admin-customers-api.test.ts',
          'src/features/catalog/api/coupons/admin-coupons-api.test.ts',
        ],
      },
    ],
    capabilities: ['web/API transport', 'browser CSRF header mirroring', 'admin transport paths'],
  },
];

export const unavailableRuntimeCoverage: readonly string[] = [
  'PostgreSQL-backed integration against the exact postgres:16-alpine service',
  'Redis-backed OTP state and worker runtime against the exact redis:7-alpine service',
  'real SMS, payment, shipping, and notification providers',
  'authenticated browser journeys requiring user-controlled OTP, CAPTCHA, or SMS data',
  'concurrent reservation race execution against a database-backed runtime harness',
];
