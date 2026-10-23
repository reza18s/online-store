# Page Context

## Page

**Path:** `src/features/orders/components/order-management/OrderDetailView.tsx`

```tsx
import { useState, type FormEvent } from 'react';
import { type AdminReturnReviewStatus, type AdminShipmentStatus } from '@nova/api-client';
import { Button, Input as UiInput, Select as UiSelect, Textarea as UiTextarea } from '@nova/ui';
import {
  useAdminOrder,
  useReviewAdminOrderReturn,
  useUpdateAdminOrderShipment,
  useUpdateAdminOrderStatus,
} from '@/features/orders/api/admin-orders-api';
import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

import type {
  AdminFulfillmentOrderStatus,
  PendingAction,
  ShipmentDraft,
} from '@/features/orders/pages/admin-orders-page-shared';
import {
  FULFILLMENT_STATUS_OPTIONS,
  RETURN_REVIEW_OPTIONS,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_OPTIONS,
} from '@/features/orders/pages/admin-orders-page-shared';

import { AddressPanel } from '@/features/orders/components/order-management/address-panel';

import { Modal } from '@/features/orders/components/order-management/modal';

import { OperationsPanel } from '@/features/orders/components/order-management/operations-panel';

import { PanelHeading } from '@/features/orders/components/order-management/panel-heading';

import { PaymentChip } from '@/features/orders/components/order-management/payment-chip';

import { PermissionPanel } from '@/features/orders/components/order-management/permission-panel';

import { RefundPanel } from '@/features/orders/components/order-management/refund-panel';

import { ReturnPanel } from '@/features/orders/components/order-management/return-panel';

import { StatePanel } from '@/features/orders/components/order-management/state-panel';

import { StatusChip } from '@/features/orders/components/order-management/status-chip';

import { SummaryCard } from '@/features/orders/components/order-management/summary-card';

import { adminOrderErrorMessage } from '@/features/orders/components/order-management/admin-order-error-message';

import { adminOrderStatusLabel } from '@/features/orders/components/order-management/admin-order-status-label';

import { formatDate } from '@/features/orders/components/order-management/format-date';

import { formatSnapshot } from '@/features/orders/components/order-management/format-snapshot';

import { formatToman } from '@/shared/utils/format-toman';

import { hasAdminStaffRole } from '@/features/orders/components/order-management/has-admin-staff-role';

import { isSafeTrackingReference } from '@/features/orders/components/order-management/is-safe-tracking-reference';

import { normalizeTrackingReference } from '@/features/orders/components/order-management/normalize-tracking-reference';

import { orderActionTitle } from '@/features/orders/components/order-management/order-action-title';

export function OrderDetailView({
  orderNumber,
  staffRoles,
}: {
  orderNumber: string;
  staffRoles?: readonly string[];
}) {
  const canView = hasAdminStaffRole(staffRoles);
  const canOperate = hasAdminStaffRole(staffRoles, ['operations', 'admin']);
  const canReviewReturns = hasAdminStaffRole(staffRoles, ['support', 'admin']);
  const orderQuery = useAdminOrder(orderNumber, canView);
  const statusMutation = useUpdateAdminOrderStatus();
  const shipmentMutation = useUpdateAdminOrderShipment();
  const returnMutation = useReviewAdminOrderReturn();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [shipmentDraft, setShipmentDraft] = useState<ShipmentDraft>({
    provider: '',
    method: '',
    status: 'PENDING',
    trackingReference: '',
  });

  const closeAction = () => {
    if (statusMutation.isPending || shipmentMutation.isPending || returnMutation.isPending) return;
    setPendingAction(null);
    setActionError('');
    setReason('');
  };

  function openStatus(target: AdminFulfillmentOrderStatus) {
    setSuccessMessage('');
    setActionError('');
    setReason('');
    setPendingAction({ kind: 'status', target });
  }

  function openShipment() {
    setSuccessMessage('');
    setActionError('');
    setReason('');
    setShipmentDraft({
      provider: orderQuery.data?.shipment?.provider ?? '',
      method: orderQuery.data?.shipment?.method ?? '',
      status:
        orderQuery.data?.shipment?.status === 'RETURNED'
          ? 'PENDING'
          : (orderQuery.data?.shipment?.status ?? 'PENDING'),
      trackingReference: orderQuery.data?.shipment?.trackingReference ?? '',
    });
    setPendingAction({ kind: 'shipment' });
  }

  function openReturn(target: AdminReturnReviewStatus) {
    setSuccessMessage('');
    setActionError('');
    setReason('');
    setPendingAction({ kind: 'return', target });
  }

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const order = orderQuery.data;
    if (!order || !pendingAction) return;
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setActionError('برای ثبت عملیات، دلیل را وارد کنید.');
      return;
    }
    if (trimmedReason.length > 500) {
      setActionError('دلیل عملیات نباید بیشتر از ۵۰۰ نویسه باشد.');
      return;
    }
    setActionError('');
    try {
      if (pendingAction.kind === 'status') {
        await statusMutation.mutateAsync({
          orderNumber: order.orderNumber,
          input: {
            status: pendingAction.target,
            reason: trimmedReason,
            expectedUpdatedAt: order.updatedAt,
          },
        });
        setSuccessMessage('وضعیت سفارش با موفقیت ثبت شد.');
      } else if (pendingAction.kind === 'shipment') {
        const provider = shipmentDraft.provider.trim();
        const method = shipmentDraft.method.trim();
        const trackingReference = normalizeTrackingReference(shipmentDraft.trackingReference);
        if (!provider || !method) {
          setActionError('نام سرویس و روش ارسال را وارد کنید.');
          return;
        }
        if (trackingReference && !isSafeTrackingReference(trackingReference)) {
          setActionError('شناسه رهگیری فقط می‌تواند شامل حروف لاتین، عدد و . _ : - باشد.');
          return;
        }
        await shipmentMutation.mutateAsync({
          orderNumber: order.orderNumber,
          input: {
            provider,
            method,
            status: shipmentDraft.status,
            trackingReference,
            reason: trimmedReason,
            expectedUpdatedAt: order.updatedAt,
          },
        });
        setSuccessMessage('اطلاعات ارسال با موفقیت ثبت شد.');
      } else {
        await returnMutation.mutateAsync({
          orderNumber: order.orderNumber,
          input: {
            status: pendingAction.target,
            reason: trimmedReason,
            expectedUpdatedAt: order.updatedAt,
          },
        });
        setSuccessMessage(
          pendingAction.target === 'RECEIVED'
            ? 'دریافت ثبت شد؛ وضعیت بازپرداخت از پاسخ سرویس به‌روزرسانی می‌شود.'
            : 'بررسی درخواست بازگشت با موفقیت ثبت شد.',
        );
      }
      closeAction();
    } catch (error) {
      setActionError(
        adminOrderErrorMessage(
          error,
          'عملیات انجام نشد؛ اطلاعات تازه را بررسی و دوباره تلاش کنید.',
        ),
      );
    }
  }

  if (!canView) return <PermissionPanel />;
  if (orderQuery.isPending && !orderQuery.data)
    return (
      <StatePanel
        icon="package"
        title="در حال دریافت جزئیات سفارش"
        description="نمایش سفارش از سرویس مدیریت بارگیری می‌شود."
      />
    );
  if (orderQuery.isError || !orderQuery.data)
    return (
      <StatePanel
        icon="warning"
        title="جزئیات سفارش در دسترس نیست"
        description={adminOrderErrorMessage(
          orderQuery.error,
          'این سفارش پیدا نشد یا قابل مشاهده نیست.',
        )}
        tone="danger"
        action={
          <Button onClick={() => void orderQuery.refetch()} variant="outline">
            <Icon name="refresh" size={17} />
            تلاش دوباره
          </Button>
        }
      />
    );

  const order = orderQuery.data;
  const isSubmitting =
    statusMutation.isPending || shipmentMutation.isPending || returnMutation.isPending;
  const returnRequest = order.returnRequest;
  return (
    <main
      className="admin-reference-order-detail space-y-5"
      aria-labelledby="admin-order-detail-title"
    >
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <a
            className="inline-flex min-h-11 items-center gap-2 text-xs text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            href="/admin/orders"
          >
            <Icon name="arrow-right" size={17} />
            بازگشت به سفارش‌ها
          </a>
          <p className="mt-4 text-[10px] font-semibold tracking-[0.18em] text-primary">
            جزئیات سفارش / عملیات
          </p>
          <h1 className="mt-2 text-3xl font-bold" id="admin-order-detail-title">
            <span dir="ltr">{order.orderNumber}</span>
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            آخرین تغییر: {formatDate(order.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={order.status} />
          <PaymentChip status={order.paymentStatus} />
        </div>
      </header>

      {successMessage ? (
        <div
          className="flex items-start gap-3 border border-success/30 bg-success-soft p-4 text-sm text-success"
          role="status"
        >
          <Icon name="check" size={19} />
          <span>{successMessage}</span>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3" aria-label="خلاصه سفارش">
        <SummaryCard
          icon="package"
          label="مبلغ نهایی"
          value={formatToman(order.totalToman)}
          detail={`ثبت شده در ${formatDate(order.createdAt)}`}
        />
        <SummaryCard
          icon="user"
          label="مشتری"
          value={order.customer?.email ?? 'مشتری ثبت‌نشده'}
          detail={order.customer?.phone ?? 'شماره ثبت نشده'}
          ltrValue={Boolean(order.customer?.email)}
          ltrDetail={Boolean(order.customer?.phone)}
        />
        <SummaryCard
          icon="truck"
          label="ارسال"
          value={
            order.shipment
              ? (SHIPMENT_STATUS_LABELS[order.shipment.status] ?? 'نامشخص')
              : 'ثبت نشده'
          }
          detail={order.shipment?.trackingReference ?? 'شناسه رهگیری ثبت نشده'}
          ltrDetail={Boolean(order.shipment?.trackingReference)}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-5">
          <section
            className="border border-border bg-surface shadow-card"
            aria-labelledby="admin-order-items-title"
          >
            <PanelHeading icon="bag" title="اقلام سفارش" id="admin-order-items-title">
              <span className="text-xs text-muted-foreground">نسخه ثبت‌شده و غیرقابل ویرایش</span>
            </PanelHeading>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div
                  className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:p-5"
                  key={item.id}
                >
                  <div>
                    <strong className="block text-sm">{item.productName}</strong>
                    <span className="mt-1 block text-xs text-muted-foreground" dir="ltr">
                      SKU: {item.sku}
                    </span>
                    <span className="mt-2 block text-[11px] text-primary">
                      {formatSnapshot(item.variantSnapshot)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    تعداد: {formatPersianNumber(item.quantity)}
                  </span>
                  <strong className="text-sm whitespace-nowrap">
                    {formatToman(item.totalToman)}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <section
            className="border border-border bg-surface shadow-card"
            aria-labelledby="admin-order-timeline-title"
          >
            <PanelHeading icon="calendar" title="خط زمانی وضعیت" id="admin-order-timeline-title" />
            {order.events.length ? (
              <ol className="divide-y divide-border">
                {order.events.map((event, index) => (
                  <li className="flex gap-3 p-4 md:p-5" key={`${event.createdAt}-${index}`}>
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-primary">
                      <Icon name="check" size={16} />
                    </span>
                    <div>
                      <strong className="block text-sm">
                        {event.toStatus ? adminOrderStatusLabel(event.toStatus) : 'ثبت سفارش'}
                      </strong>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {formatDate(event.createdAt)}
                        {event.fromStatus ? ` · از ${adminOrderStatusLabel(event.fromStatus)}` : ''}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="p-5 text-sm text-muted-foreground">رویداد قابل نمایش ثبت نشده است.</p>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <OperationsPanel
            canOperate={canOperate}
            onShipment={openShipment}
            onStatus={openStatus}
            order={order}
          />
          <ReturnPanel
            canReview={canReviewReturns}
            onReview={openReturn}
            orderItems={order.items}
            request={returnRequest}
          />
          <RefundPanel refunds={order.refunds} payment={order.payment} />
          <AddressPanel address={order.address} />
        </div>
      </section>

      {pendingAction ? (
        <Modal
          description={
            pendingAction.kind === 'return' && pendingAction.target === 'RECEIVED'
              ? 'این عملیات طبق قرارداد سرویس، دریافت کالا و فرایند بازپرداخت را ثبت می‌کند. نتیجه موفق یا ناموفق در همین سفارش قابل مشاهده خواهد بود.'
              : 'این تغییر پس از تأیید با نسخه فعلی سفارش ثبت می‌شود.'
          }
          onClose={closeAction}
          title={orderActionTitle(pendingAction)}
        >
          <form className="space-y-4" onSubmit={submitAction}>
            {pendingAction.kind === 'status' ? (
              <label className="block text-xs text-muted-foreground">
                وضعیت هدف
                <UiSelect
                  className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) =>
                    setPendingAction({
                      kind: 'status',
                      target: event.target.value as AdminFulfillmentOrderStatus,
                    })
                  }
                  value={pendingAction.target}
                >
                  {FULFILLMENT_STATUS_OPTIONS.map(([status, label]) => (
                    <option key={status} value={status}>
                      {label}
                    </option>
                  ))}
                </UiSelect>
              </label>
            ) : null}
            {pendingAction.kind === 'return' ? (
              <label className="block text-xs text-muted-foreground">
                نتیجه بررسی
                <UiSelect
                  className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) =>
                    setPendingAction({
                      kind: 'return',
                      target: event.target.value as AdminReturnReviewStatus,
                    })
                  }
                  value={pendingAction.target}
                >
                  {RETURN_REVIEW_OPTIONS.map(([status, label]) => (
                    <option key={status} value={status}>
                      {label}
                    </option>
                  ))}
                </UiSelect>
              </label>
            ) : null}
            {pendingAction.kind === 'shipment' ? (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-xs text-muted-foreground">
                  سرویس ارسال
                  <UiInput
                    required
                    className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    maxLength={80}
                    onChange={(event) =>
                      setShipmentDraft((draft) => ({ ...draft, provider: event.target.value }))
                    }
                    value={shipmentDraft.provider}
                  />
                </label>
                <label className="block text-xs text-muted-foreground">
                  روش ارسال
                  <UiInput
                    required
                    className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    maxLength={80}
                    onChange={(event) =>
                      setShipmentDraft((draft) => ({ ...draft, method: event.target.value }))
                    }
                    value={shipmentDraft.method}
                  />
                </label>
                <label className="block text-xs text-muted-foreground">
                  وضعیت ارسال
                  <UiSelect
                    className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) =>
                      setShipmentDraft((draft) => ({
                        ...draft,
                        status: event.target.value as AdminShipmentStatus,
                      }))
                    }
                    value={shipmentDraft.status}
                  >
                    {SHIPMENT_STATUS_OPTIONS.map(([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ))}
                  </UiSelect>
                </label>
                <label className="block text-xs text-muted-foreground">
                  شناسه رهگیری
                  <span className="relative mt-2 block">
                    <UiInput
                      className="min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      dir="ltr"
                      maxLength={128}
                      onChange={(event) =>
                        setShipmentDraft((draft) => ({
                          ...draft,
                          trackingReference: event.target.value,
                        }))
                      }
                      placeholder="TRK-2026-001"
                      value={shipmentDraft.trackingReference}
                    />
                  </span>
                </label>
              </div>
            ) : null}
            <label className="block text-xs text-muted-foreground">
              دلیل عملیات
              <UiTextarea
                required
                aria-describedby={actionError ? 'admin-order-action-error' : undefined}
                className="mt-2 min-h-28 w-full resize-y border border-border bg-background px-3 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder="دلیل قابل پیگیری این تغییر را بنویسید."
                value={reason}
              />
            </label>
            {actionError ? (
              <p
                className="border border-destructive/30 bg-error-soft p-3 text-sm leading-7 text-destructive"
                id="admin-order-action-error"
                role="alert"
              >
                {actionError}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button disabled={isSubmitting} onClick={closeAction} type="button" variant="outline">
                انصراف
              </Button>
              <Button loading={isSubmitting} type="submit">
                تأیید و ثبت
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </main>
  );
}

```

---

## Custom Components


### 1. Badge

**Path:** `../../packages/ui/src/badge.tsx`

```tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from './cn';

export const badgeVariants = cva(
  'nova-badge inline-flex min-h-8 items-center justify-center rounded-control border px-2.5 py-1 text-[11px] font-semibold leading-4 transition-colors motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-foreground',
        outline: 'border-border bg-transparent text-foreground',
        success: 'border-success-100 bg-success-100 text-success',
        warning: 'border-warning-100 bg-warning-100 text-warning',
        destructive: 'border-destructive-100 bg-destructive-100 text-destructive',
        info: 'border-info-100 bg-info-100 text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  ),
);

Badge.displayName = 'Badge';

```

---


### 2. Button

**Path:** `../../packages/ui/src/button.tsx`

```tsx
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from './cn';

export const buttonVariants = cva(
  'nova-button inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-transparent px-4 text-center text-sm font-semibold leading-5 transition-[background-color,border-color,color,transform] duration-[140ms] ease-out hover:-translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-foreground',
        secondary: 'bg-secondary text-foreground hover:bg-accent-soft hover:text-primary-hover',
        outline:
          'border-primary bg-transparent text-primary hover:border-primary-hover hover:bg-accent-soft hover:text-primary-hover',
        ghost: 'bg-transparent text-foreground hover:bg-secondary',
        destructive: 'bg-destructive text-primary-foreground hover:bg-destructive-hover',
      },
      size: {
        sm: 'min-h-11 px-3 text-[13px]',
        md: 'min-h-12',
        lg: 'min-h-[52px] px-5',
        icon: 'h-11 min-h-11 w-11 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled = false,
      'aria-busy': ariaBusy,
      'aria-disabled': ariaDisabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Component
        aria-busy={loading || ariaBusy || undefined}
        aria-disabled={isDisabled || ariaDisabled || undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        data-loading={loading ? 'true' : undefined}
        disabled={asChild ? disabled : isDisabled}
        ref={ref}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent motion-reduce:animate-none"
          />
        ) : null}
        {asChild ? <Slottable>{children}</Slottable> : children}
      </Component>
    );
  },
);

Button.displayName = 'Button';

```

---


### 3. Input

**Path:** `../../packages/ui/src/input.tsx`

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from './cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'nova-input flex min-h-12 w-full rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

```

---


### 4. Select

**Path:** `../../packages/ui/src/select.tsx`

```tsx
import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

import { cn } from './cn';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'nova-select flex min-h-12 w-full rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
      className,
    )}
    {...props}
  />
));

Select.displayName = 'Select';

```

---


### 5. Textarea

**Path:** `../../packages/ui/src/textarea.tsx`

```tsx
import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

import { cn } from './cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'nova-textarea min-h-28 w-full resize-y rounded-control border border-border bg-background px-3 py-3 text-sm leading-7 text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';

```

---


### 6. AddressPanel

**Path:** `src/features/orders/components/order-management/address-panel.tsx`

```tsx
import { type AdminOrderDetail } from '@nova/api-client';

import { PanelHeading } from '@/features/orders/components/order-management/panel-heading';

export function AddressPanel({ address }: { address: AdminOrderDetail['address'] }) {
  return (
    <section
      className="border border-border bg-surface shadow-card"
      aria-labelledby="admin-order-address-title"
    >
      <PanelHeading icon="info" title="نشانی ثبت‌شده" id="admin-order-address-title" />
      {address ? (
        <div className="space-y-2 p-4 text-xs leading-7 md:p-5">
          <p>{address.recipientName}</p>
          <p className="text-muted-foreground">
            {address.province}، {address.city}، {address.addressLine}
          </p>
          <p className="text-muted-foreground">
            <span dir="ltr">{address.phone}</span> · <span dir="ltr">{address.postalCode}</span>
          </p>
        </div>
      ) : (
        <p className="p-5 text-sm text-muted-foreground">نشانی برای این سفارش ثبت نشده است.</p>
      )}
    </section>
  );
}

```

---


### 7. Modal

**Path:** `src/features/orders/components/order-management/modal.tsx`

```tsx
import { useEffect, useRef, type ReactNode } from 'react';

import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import { MODAL_FOCUSABLE_SELECTOR } from '@/features/orders/pages/admin-orders-page-shared';

import { getModalFocusWrapIndex } from '@/features/orders/components/order-management/get-modal-focus-wrap-index';

export function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hidden && element.getClientRects().length > 0);
      const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const wrapIndex = getModalFocusWrapIndex(activeIndex, focusable.length, event.shiftKey);
      if (wrapIndex === null) return;

      event.preventDefault();
      focusable[wrapIndex]?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/45 p-4 pt-[10vh]"
      role="presentation"
    >
      <div
        aria-labelledby="admin-order-dialog-title"
        aria-modal="true"
        className="w-full max-w-xl border border-border bg-surface p-5 shadow-float md:p-7"
        role="dialog"
        ref={dialogRef}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-primary">تأیید عملیات</p>
            <h2 className="mt-2 text-xl font-semibold" id="admin-order-dialog-title">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Button
            ref={closeRef}
            aria-label="بستن پنجره"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" size={20} />
          </Button>
        </div>
        <div className="pt-5">{children}</div>
      </div>
    </div>
  );
}

```

---


### 8. OperationsPanel

**Path:** `src/features/orders/components/order-management/operations-panel.tsx`

```tsx
import { type AdminOrderDetail } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import type { AdminFulfillmentOrderStatus } from '@/features/orders/pages/admin-orders-page-shared';
import {
  FULFILLMENT_STATUS_OPTIONS,
  SHIPMENT_STATUS_LABELS,
} from '@/features/orders/pages/admin-orders-page-shared';

import { PanelHeading } from '@/features/orders/components/order-management/panel-heading';

import { StatusChip } from '@/features/orders/components/order-management/status-chip';

export function OperationsPanel({
  order,
  canOperate,
  onStatus,
  onShipment,
}: {
  order: AdminOrderDetail;
  canOperate: boolean;
  onStatus: (target: AdminFulfillmentOrderStatus) => void;
  onShipment: () => void;
}) {
  return (
    <section
      className="border border-border bg-surface shadow-card"
      aria-labelledby="admin-order-operations-title"
    >
      <PanelHeading
        icon="truck"
        title="عملیات fulfillment و ارسال"
        id="admin-order-operations-title"
      />
      <div className="space-y-4 p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">وضعیت فعلی</span>
          <StatusChip status={order.status} />
        </div>
        <div className="grid gap-2">
          <p className="text-xs font-medium">تغییر وضعیت</p>
          <div className="grid grid-cols-3 gap-2">
            {FULFILLMENT_STATUS_OPTIONS.map(([status, label]) => (
              <Button
                disabled={!canOperate || order.status === status}
                key={status}
                onClick={() => onStatus(status)}
                size="sm"
                variant={order.status === status ? 'secondary' : 'outline'}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium">اطلاعات ارسال</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {order.shipment
                  ? `${SHIPMENT_STATUS_LABELS[order.shipment.status]} · ${order.shipment.method}`
                  : 'هنوز ثبت نشده'}
              </p>
            </div>
            {order.shipment?.trackingReference ? (
              <span className="max-w-[130px] truncate text-[10px] text-primary" dir="ltr">
                {order.shipment.trackingReference}
              </span>
            ) : null}
          </div>
          <Button
            className="mt-3 w-full"
            disabled={!canOperate}
            onClick={onShipment}
            size="sm"
            variant="outline"
          >
            <Icon name="edit" size={16} />
            ویرایش اطلاعات ارسال
          </Button>
        </div>
        {!canOperate ? (
          <p className="flex items-start gap-2 text-[11px] leading-6 text-muted-foreground">
            <Icon name="info" size={15} />
            نقش فعلی فقط اجازه مشاهده این عملیات را دارد.
          </p>
        ) : null}
      </div>
    </section>
  );
}

```

---


### 9. PanelHeading

**Path:** `src/features/orders/components/order-management/panel-heading.tsx`

```tsx
import { type ReactNode } from 'react';

import { Icon } from '@/shared/ui/icon';

export function PanelHeading({
  icon,
  title,
  id,
  children,
}: {
  icon: 'bag' | 'calendar' | 'truck' | 'rotate' | 'info';
  title: string;
  id: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-5">
      <h2 className="flex items-center gap-2 text-base font-semibold" id={id}>
        <Icon name={icon} size={18} />
        {title}
      </h2>
      {children}
    </div>
  );
}

```

---


### 10. PaymentChip

**Path:** `src/features/orders/components/order-management/payment-chip.tsx`

```tsx
import { Badge } from '@nova/ui';

import { PAYMENT_STATUS_LABELS } from '@/features/orders/pages/admin-orders-page-shared';

import { statusBadgeVariant } from '@/features/orders/components/order-management/status-badge-variant';

export function PaymentChip({ status }: { status: string }) {
  const tone =
    status === 'PAID' || status === 'REFUNDED'
      ? 'success'
      : status === 'FAILED'
        ? 'danger'
        : 'warning';
  return (
    <Badge variant={statusBadgeVariant(tone)} className="min-h-7 rounded-md text-[11px]">
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

```

---


### 11. PermissionPanel

**Path:** `src/features/orders/components/order-management/permission-panel.tsx`

```tsx
import { StatePanel } from '@/features/orders/components/order-management/state-panel';

export function PermissionPanel() {
  return (
    <StatePanel
      icon="warning"
      title="دسترسی عملیات سفارش ندارید"
      description="این بخش فقط برای اعضای مجاز پشتیبانی، عملیات یا مدیر سیستم در دسترس است."
      tone="danger"
    />
  );
}

```

---


### 12. RefundPanel

**Path:** `src/features/orders/components/order-management/refund-panel.tsx`

```tsx
import { type AdminOrderDetail } from '@nova/api-client';

import { REFUND_STATUS_LABELS } from '@/features/orders/pages/admin-orders-page-shared';

import { PanelHeading } from '@/features/orders/components/order-management/panel-heading';

import { StatusChip } from '@/features/orders/components/order-management/status-chip';

import { adminPaymentAttemptStatusLabel } from '@/features/orders/components/order-management/admin-payment-attempt-status-label';

import { formatDate } from '@/features/orders/components/order-management/format-date';

import { formatToman } from '@/shared/utils/format-toman';

export function RefundPanel({
  refunds,
  payment,
}: {
  refunds: AdminOrderDetail['refunds'];
  payment: AdminOrderDetail['payment'];
}) {
  return (
    <section
      className="border border-border bg-surface shadow-card"
      aria-labelledby="admin-order-refund-title"
    >
      <PanelHeading icon="rotate" title="بازپرداخت‌ها" id="admin-order-refund-title" />
      {refunds.length ? (
        <div className="divide-y divide-border">
          {refunds.map((refund) => (
            <div className="space-y-2 p-4 md:p-5" key={refund.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{formatToman(refund.amountToman)}</span>
                <StatusChip
                  label={REFUND_STATUS_LABELS[refund.status] ?? refund.status}
                  status={refund.status}
                />
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-[10px] text-muted-foreground">
                <span>{formatDate(refund.createdAt)}</span>
                <span dir="ltr">شناسه داخلی: {refund.id}</span>
              </div>
              {refund.reason ? (
                <p className="text-xs leading-6 text-muted-foreground">دلیل: {refund.reason}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5">
          <p className="text-sm text-muted-foreground">بازپرداختی برای این سفارش ثبت نشده است.</p>
          {payment ? (
            <p className="mt-2 text-xs text-muted-foreground">
              وضعیت تلاش پرداخت: {adminPaymentAttemptStatusLabel(payment.status)}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

```

---


### 13. ReturnPanel

**Path:** `src/features/orders/components/order-management/return-panel.tsx`

```tsx
import { type AdminOrderDetail, type AdminReturnReviewStatus } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

import {
  canReviewReturnStatus,
  RETURN_REVIEW_OPTIONS,
  RETURN_STATUS_LABELS,
} from '@/features/orders/pages/admin-orders-page-shared';

import { PanelHeading } from '@/features/orders/components/order-management/panel-heading';

import { StatusChip } from '@/features/orders/components/order-management/status-chip';

import { formatDate } from '@/features/orders/components/order-management/format-date';

import { formatSnapshot } from '@/features/orders/components/order-management/format-snapshot';

export function ReturnPanel({
  request,
  canReview,
  onReview,
  orderItems,
}: {
  request: AdminOrderDetail['returnRequest'];
  canReview: boolean;
  onReview: (target: AdminReturnReviewStatus) => void;
  orderItems: AdminOrderDetail['items'];
}) {
  return (
    <section
      className="border border-border bg-surface shadow-card"
      aria-labelledby="admin-order-return-title"
    >
      <PanelHeading icon="rotate" title="بررسی بازگشت" id="admin-order-return-title" />
      {request ? (
        <div className="space-y-4 p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">وضعیت درخواست</span>
            <StatusChip
              label={RETURN_STATUS_LABELS[request.status] ?? request.status}
              status={request.status}
            />
          </div>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">دلیل</dt>
              <dd>{request.reason}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">درخواست در</dt>
              <dd>{formatDate(request.requestedAt)}</dd>
            </div>
            {request.reviewedAt ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">بررسی در</dt>
                <dd>{formatDate(request.reviewedAt)}</dd>
              </div>
            ) : null}
            {request.receivedAt ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">دریافت در</dt>
                <dd>{formatDate(request.receivedAt)}</dd>
              </div>
            ) : null}
          </dl>
          {request.note ? (
            <div className="border border-border bg-background p-3 text-xs leading-6">
              <strong className="block text-[11px]">یادداشت مشتری</strong>
              <p className="mt-1 text-muted-foreground">{request.note}</p>
            </div>
          ) : null}
          <div>
            <h3 className="text-xs font-medium">اقلام درخواست بازگشت</h3>
            <ul className="mt-2 divide-y divide-border border border-border">
              {request.items.map((returnItem) => {
                const orderItem = orderItems.find((item) => item.id === returnItem.orderItemId);
                return (
                  <li className="space-y-1 p-3 text-xs" key={returnItem.orderItemId}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium">
                        {orderItem?.productName ?? `قلم ${returnItem.orderItemId}`}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        تعداد: {formatPersianNumber(returnItem.quantity)}
                      </span>
                    </div>
                    {orderItem ? (
                      <>
                        <span className="block text-[10px] text-muted-foreground" dir="ltr">
                          SKU: {orderItem.sku}
                        </span>
                        <span className="block text-[10px] text-primary">
                          {formatSnapshot(orderItem.variantSnapshot)}
                        </span>
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="grid gap-2">
            {RETURN_REVIEW_OPTIONS.map(([status, label]) => (
              <Button
                disabled={
                  !canReview ||
                  !canReviewReturnStatus(request.status, status)
                }
                key={status}
                onClick={() => onReview(status)}
                size="sm"
                variant={status === 'RECEIVED' ? 'primary' : 'outline'}
              >
                {request.status === 'RECEIVED' && status === 'RECEIVED'
                  ? 'تلاش دوباره بازپرداخت'
                  : label}
              </Button>
            ))}
          </div>
          {!canReview ? (
            <p className="flex items-start gap-2 text-[11px] leading-6 text-muted-foreground">
              <Icon name="info" size={15} />
              نقش فعلی اجازه بررسی درخواست بازگشت را ندارد.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="p-5 text-sm leading-7 text-muted-foreground">
          برای این سفارش درخواست بازگشتی ثبت نشده است.
        </p>
      )}
    </section>
  );
}

```

---


### 14. StatePanel

**Path:** `src/features/orders/components/order-management/state-panel.tsx`

```tsx
import { type ReactNode } from 'react';

import { Icon } from '@/shared/ui/icon';

export function StatePanel({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
}: {
  icon: 'package' | 'warning' | 'refresh' | 'info';
  title: string;
  description: string;
  action?: ReactNode;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <section
      className={`border bg-surface p-8 text-center shadow-card ${tone === 'danger' ? 'border-destructive/40' : 'border-border'}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <div
        className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${tone === 'danger' ? 'bg-error-soft text-destructive' : 'bg-secondary text-primary'}`}
      >
        <Icon name={icon} size={22} />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}

```

---


### 15. StatusChip

**Path:** `src/features/orders/components/order-management/status-chip.tsx`

```tsx
import { Badge } from '@nova/ui';

import { adminOrderStatusLabel } from '@/features/orders/components/order-management/admin-order-status-label';

import { adminOrderStatusTone } from '@/features/orders/components/order-management/admin-order-status-tone';

import { statusBadgeVariant } from '@/features/orders/components/order-management/status-badge-variant';

export function StatusChip({
  status,
  label = adminOrderStatusLabel(status),
}: {
  status: string;
  label?: string;
}) {
  return (
    <Badge
      variant={statusBadgeVariant(adminOrderStatusTone(status))}
      className="min-h-7 rounded-md text-[11px]"
    >
      {label}
    </Badge>
  );
}

```

---


### 16. SummaryCard

**Path:** `src/features/orders/components/order-management/summary-card.tsx`

```tsx
import { Icon } from '@/shared/ui/icon';

export function SummaryCard({
  icon,
  label,
  value,
  detail,
  ltrValue = false,
  ltrDetail = false,
}: {
  icon: 'package' | 'user' | 'truck';
  label: string;
  value: string;
  detail: string;
  ltrValue?: boolean;
  ltrDetail?: boolean;
}) {
  return (
    <article className="border border-border bg-surface p-4 shadow-card md:p-5">
      <div className="flex items-center gap-3 text-primary">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
          <Icon name={icon} size={18} />
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <strong
        className={`mt-4 block min-w-0 text-base ${ltrValue ? 'break-all text-left' : 'truncate'}`}
        dir={ltrValue ? 'ltr' : undefined}
        title={value}
      >
        {value}
      </strong>
      <span
        className="mt-2 block truncate text-[10px] text-muted-foreground"
        dir={ltrDetail ? 'ltr' : undefined}
        title={detail}
      >
        {detail}
      </span>
    </article>
  );
}

```

---


### 17. Icon

**Path:** `src/shared/ui/icon.tsx`

```tsx
import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'bag'
  | 'bell'
  | 'book'
  | 'calendar'
  | 'check'
  | 'chevron-down'
  | 'close'
  | 'dress'
  | 'edit'
  | 'eye'
  | 'filter'
  | 'grid'
  | 'heart'
  | 'home'
  | 'info'
  | 'instagram'
  | 'layers'
  | 'mail'
  | 'menu'
  | 'more-vertical'
  | 'package'
  | 'plus'
  | 'refresh'
  | 'rotate'
  | 'search'
  | 'send'
  | 'settings'
  | 'shield'
  | 'shirt'
  | 'sparkles'
  | 'tag'
  | 'truck'
  | 'user'
  | 'users'
  | 'warehouse'
  | 'warning';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const iconPaths: Record<IconName, ReactNode> = {
  'arrow-left': <path d="m9 5 7 7-7 7" />,
  'arrow-right': <path d="m15 5-7 7 7 7" />,
  bag: (
    <>
      <path d="M5 8.5h14l-1 11H6l-1-11Z" />
      <path d="M8.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" />
      <path d="M10 21h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M7 3v4M17 3v4M3.5 9h17" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  dress: (
    <>
      <path d="M9 4.5a3 3 0 0 0 6 0" />
      <path d="m9 6-2 4 2 1-3 8h8l-3-8 2-1-2-4" />
      <path d="m15 6 2 4-2 1 3 8h-8" />
    </>
  ),
  edit: (
    <>
      <path d="m4 16.5-.7 4.2 4.2-.7L19 8.5 15.5 5 4 16.5Z" />
      <path d="m13.5 7 3.5 3.5M4 20.5l3.5-3.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  filter: (
    <>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  heart: (
    <path d="M20.8 8.8c0 5.2-8.8 10.4-8.8 10.4S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.3Z" />
  ),
  home: (
    <>
      <path d="m3.5 10.5 8.5-7 8.5 7" />
      <path d="M5.5 9.5v10h13v-10M9 19.5v-5h6v5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5v5M12 7.5h.01" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 5.5L19.5 7" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  'more-vertical': (
    <>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  package: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 7.8 7.5 4.2 7.5-4.2M12 12v9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-13.6-5.7L4 7.5" />
      <path d="M4 4v3.5h3.5M4 13a8 8 0 0 0 13.6 5.7l2.4-2.2" />
      <path d="M20 20v-3.5h-3.5" />
    </>
  ),
  rotate: (
    <>
      <path d="M4 12a8 8 0 0 1 13.6-5.7L20 8.5" />
      <path d="M20 5v3.5h-3.5M20 12a8 8 0 0 1-13.6 5.7L4 15.5" />
      <path d="M4 19v-3.5h3.5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  send: <path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  shield: <path d="M12 3.5 19 6v5.5c0 4.3-2.7 7.7-7 9-4.3-1.3-7-4.7-7-9V6l7-2.5Z" />,
  shirt: (
    <>
      <path d="m8 5 4 2 4-2 4 3-2.5 4-2-1v9h-7v-9l-2 1L4 8l4-3Z" />
      <path d="M10 6.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  sparkles: (
    <>
      <path d="m8 3 1.2 3.8L13 8l-3.8 1.2L8 13l-1.2-3.8L3 8l3.8-1.2L8 3Z" />
      <path d="m17 12 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM17 3v3M18.5 4.5h-3" />
    </>
  ),
  tag: (
    <>
      <path d="M4 4h7l9 9-7 7-9-9V4Z" />
      <circle cx="8" cy="8" r="1" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7V9Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 4 5" />
    </>
  ),
  warehouse: (
    <>
      <path d="m3 9 9-5 9 5v11H3V9Z" />
      <path d="M7 20v-6h10v6M7 10h.01M12 10h.01M17 10h.01" />
    </>
  ),
  warning: (
    <>
      <path d="m12 3 9 16H3l9-16Z" />
      <path d="M12 9v4M12 16h.01" />
    </>
  ),
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

```

---


## Summary

- Page: `src/features/orders/components/order-management/OrderDetailView.tsx`
- Custom component files: 17
- Total files included: 18
