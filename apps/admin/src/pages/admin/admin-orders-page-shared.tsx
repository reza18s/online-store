import {
  type AdminOrderStatusInput,
  type AdminReturnReviewStatus,
  type AdminShipmentStatus,
  type CheckoutOrderStatus,
} from '@nova/api-client';

export type AdminFulfillmentOrderStatus = AdminOrderStatusInput['status'];

export type AdminStaffRole = 'support' | 'operations' | 'admin';

export const MODAL_FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  CONFIRMED: 'تأیید شده',
  PREPARING: 'در حال آماده‌سازی',
  SHIPPED: 'ارسال شده',
  DELAYED: 'با تأخیر',
  EXCEPTION: 'نیازمند پیگیری',
  DELIVERED: 'تحویل شده',
  CANCELLED: 'لغو شده',
  RETURNED: 'مرجوع شده',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار پرداخت',
  PAID: 'پرداخت موفق',
  FAILED: 'پرداخت ناموفق',
  REFUNDED: 'بازپرداخت شده',
};

export const PAYMENT_ATTEMPT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار پرداخت',
  REDIRECTED: 'هدایت‌شده',
  SUCCEEDED: 'موفق',
  FAILED: 'ناموفق',
  EXPIRED: 'منقضی‌شده',
  CANCELLED: 'لغوشده',
};

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار ارسال',
  PACKED: 'بسته‌بندی شده',
  SHIPPED: 'ارسال شده',
  DELIVERED: 'تحویل شده',
  RETURNED: 'مرجوع شده',
};

export const RETURN_STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'در انتظار بررسی',
  APPROVED: 'تأیید شده',
  REJECTED: 'رد شده',
  RECEIVED: 'کالا دریافت شده',
  REFUNDED: 'بازپرداخت شده',
  CANCELLED: 'لغو شده',
};

export const REFUND_STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار بازپرداخت',
  FAILED: 'بازپرداخت ناموفق',
  SUCCEEDED: 'بازپرداخت موفق',
};

export const ORDER_STATUS_OPTIONS: Array<[CheckoutOrderStatus, string]> = [
  ['PENDING_PAYMENT', 'در انتظار پرداخت'],
  ['CONFIRMED', 'تأیید شده'],
  ['PREPARING', 'در حال آماده‌سازی'],
  ['SHIPPED', 'ارسال شده'],
  ['DELIVERED', 'تحویل شده'],
  ['CANCELLED', 'لغو شده'],
  ['RETURNED', 'مرجوع شده'],
];

export const PAYMENT_STATUS_OPTIONS = [
  ['', 'همه پرداخت‌ها'],
  ['PENDING', 'در انتظار پرداخت'],
  ['PAID', 'پرداخت موفق'],
  ['FAILED', 'پرداخت ناموفق'],
  ['REFUNDED', 'بازپرداخت شده'],
] as const;

export const FULFILLMENT_STATUS_OPTIONS: Array<[AdminFulfillmentOrderStatus, string]> = [
  ['PREPARING', 'در حال آماده‌سازی'],
  ['SHIPPED', 'ارسال شده'],
  ['DELIVERED', 'تحویل شده'],
];

export const SHIPMENT_STATUS_OPTIONS: Array<[AdminShipmentStatus, string]> = [
  ['PENDING', 'در انتظار ارسال'],
  ['PACKED', 'بسته‌بندی شده'],
  ['SHIPPED', 'ارسال شده'],
  ['DELIVERED', 'تحویل شده'],
];

export const RETURN_REVIEW_OPTIONS: Array<[AdminReturnReviewStatus, string]> = [
  ['APPROVED', 'تأیید درخواست'],
  ['REJECTED', 'رد درخواست'],
  ['RECEIVED', 'تأیید دریافت و بازپرداخت'],
];

export const SAFE_TRACKING_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export type PendingAction =
  | { kind: 'status'; target: AdminFulfillmentOrderStatus }
  | { kind: 'shipment' }
  | { kind: 'return'; target: AdminReturnReviewStatus };

export type ShipmentDraft = {
  provider: string;
  method: string;
  status: AdminShipmentStatus;
  trackingReference: string;
};
