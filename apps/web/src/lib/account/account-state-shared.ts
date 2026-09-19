import { type CustomerOrderDetail } from '@nova/api-client';

export const CUSTOMER_RETURN_WINDOW_DAYS = 7;

export const CUSTOMER_RETURN_WINDOW_MILLISECONDS =
  CUSTOMER_RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export const orderStatusCopy: Record<CustomerOrderDetail['status'], string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  CONFIRMED: 'تأیید شده',
  PREPARING: 'در حال آماده‌سازی',
  SHIPPED: 'ارسال شده',
  DELIVERED: 'تحویل شده',
  CANCELLED: 'لغو شده',
  RETURNED: 'مرجوع شده',
};

export const returnReasonCopy = {
  DAMAGED: 'کالا آسیب دیده است',
  INCORRECT_ITEM: 'کالای اشتباه ارسال شده است',
  DEFECTIVE: 'کالا ایراد دارد',
  SIZE_PREFERENCE: 'اندازه مناسب نیست',
  COLOR_PREFERENCE: 'رنگ یا ظاهر مطابق انتظار نیست',
  CHANGE_OF_MIND: 'تغییر نظر',
} as const;

export const returnRequestStatusCopy = {
  REQUESTED: 'در انتظار بررسی',
  APPROVED: 'تأیید شده',
  REJECTED: 'رد شده',
  RECEIVED: 'کالا دریافت شده',
  REFUNDED: 'بازپرداخت شده',
  CANCELLED: 'لغو شده',
} as const;

export type ReturnEligibilityReason =
  | 'eligible'
  | 'already-requested'
  | 'not-delivered'
  | 'payment-unconfirmed'
  | 'shipment-unconfirmed'
  | 'missing-delivery-date'
  | 'delivery-date-in-future'
  | 'expired';

export interface ReturnEligibility {
  eligible: boolean;
  reason: ReturnEligibilityReason;
}

export type ReturnOrderState = 'requested' | 'ineligible' | 'not-requested';
