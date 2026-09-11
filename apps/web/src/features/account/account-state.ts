import { useEffect, useRef, useState } from 'react';

import {
  queryKeys,
  ApiClientError,
  type CustomerOrderDetail,
  type CustomerUser,
} from '@nova/api-client';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';

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

export function formatToman(amount: number): string {
  return `${new Intl.NumberFormat('fa-IR').format(amount)} تومان`;
}

export function formatPersianNumber(value: number): string {
  return new Intl.NumberFormat('fa-IR').format(value);
}

export function formatPersianDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'تاریخ نامشخص';
  return new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function isCustomerActive(
  customer: CustomerUser | null | undefined,
): customer is CustomerUser {
  return Boolean(customer && customer.status === 'ACTIVE');
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 401;
}

export function isPermissionError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 403;
}

export function isOfflineError(error: unknown): boolean {
  return (
    (typeof navigator !== 'undefined' && navigator.onLine === false) || error instanceof TypeError
  );
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError && error.payload?.error.message) {
    return error.payload.error.message;
  }
  return error instanceof Error ? error.message : fallback;
}

export function canCancelCustomerOrder(order: Pick<CustomerOrderDetail, 'status'>): boolean {
  return order.status === 'PENDING_PAYMENT' || order.status === 'CONFIRMED';
}

export function getReturnEligibility(
  order: Pick<CustomerOrderDetail, 'status' | 'paymentStatus' | 'shipment' | 'returnRequest'>,
  now = new Date(),
): ReturnEligibility {
  if (order.returnRequest) return { eligible: false, reason: 'already-requested' };
  if (order.status !== 'DELIVERED') return { eligible: false, reason: 'not-delivered' };
  if (order.paymentStatus !== 'PAID') {
    return { eligible: false, reason: 'payment-unconfirmed' };
  }
  if (!order.shipment || order.shipment.status !== 'DELIVERED') {
    return { eligible: false, reason: 'shipment-unconfirmed' };
  }
  if (!order.shipment.deliveredAt) {
    return { eligible: false, reason: 'missing-delivery-date' };
  }
  const deliveredAt = new Date(order.shipment.deliveredAt);
  if (Number.isNaN(deliveredAt.getTime())) {
    return { eligible: false, reason: 'missing-delivery-date' };
  }
  const age = now.getTime() - deliveredAt.getTime();
  if (age < 0) return { eligible: false, reason: 'delivery-date-in-future' };
  if (age > CUSTOMER_RETURN_WINDOW_MILLISECONDS) {
    return { eligible: false, reason: 'expired' };
  }
  return { eligible: true, reason: 'eligible' };
}

export function clearCustomerProtectedCache(queryClient: QueryClient, resetSession = false): void {
  queryClient.removeQueries({ queryKey: queryKeys.account.addresses() });
  queryClient.removeQueries({ queryKey: queryKeys.orders.all });
  queryClient.removeQueries({ queryKey: queryKeys.cart.current() });
  if (resetSession) queryClient.setQueryData(queryKeys.account.current(), null);
}

export function useCustomerCacheBoundary(
  customerId: string | undefined,
  sessionExpired = false,
): void {
  const queryClient = useQueryClient();
  const previousCustomerId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (sessionExpired) {
      clearCustomerProtectedCache(queryClient, true);
      previousCustomerId.current = undefined;
      return;
    }
    if (customerId && previousCustomerId.current && previousCustomerId.current !== customerId) {
      clearCustomerProtectedCache(queryClient);
    }
    if (customerId) previousCustomerId.current = customerId;
  }, [customerId, queryClient, sessionExpired]);
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine !== false,
  );
  useEffect(() => {
    const setOnlineState = () => setOnline(true);
    const setOfflineState = () => setOnline(false);
    window.addEventListener('online', setOnlineState);
    window.addEventListener('offline', setOfflineState);
    return () => {
      window.removeEventListener('online', setOnlineState);
      window.removeEventListener('offline', setOfflineState);
    };
  }, []);
  return online;
}
