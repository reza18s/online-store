import { useState, type FormEvent } from 'react';
import { type AdminReturnReviewStatus, type AdminShipmentStatus } from '@nova/api-client';
import { Button, Input as UiInput, Select as UiSelect, Textarea as UiTextarea } from '@nova/ui';
import {
  useAdminOrder,
  useReviewAdminOrderReturn,
  useUpdateAdminOrderShipment,
  useUpdateAdminOrderStatus,
} from '../../../lib/admin/admin-orders-api';
import { Icon } from '../../ui/icon';

import type {
  AdminFulfillmentOrderStatus,
  PendingAction,
  ShipmentDraft,
} from '../../../pages/admin/admin-orders-page-shared';
import {
  FULFILLMENT_STATUS_OPTIONS,
  RETURN_REVIEW_OPTIONS,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_OPTIONS,
} from '../../../pages/admin/admin-orders-page-shared';

import { AddressPanel } from './address-panel';

import { Modal } from './modal';

import { OperationsPanel } from './operations-panel';

import { PanelHeading } from './panel-heading';

import { PaymentChip } from './payment-chip';

import { PermissionPanel } from './permission-panel';

import { RefundPanel } from './refund-panel';

import { ReturnPanel } from './return-panel';

import { StatePanel } from './state-panel';

import { StatusChip } from './status-chip';

import { SummaryCard } from './summary-card';

import { adminOrderErrorMessage } from './admin-order-error-message';

import { adminOrderStatusLabel } from './admin-order-status-label';

import { formatDate } from './format-date';

import { formatSnapshot } from './format-snapshot';

import { formatToman } from './format-toman';

import { hasAdminStaffRole } from './has-admin-staff-role';

import { isSafeTrackingReference } from './is-safe-tracking-reference';

import { normalizeTrackingReference } from './normalize-tracking-reference';

import { orderActionTitle } from './order-action-title';

export function AdminOrderDetailPage({
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
    <main className="space-y-5" aria-labelledby="admin-order-detail-title">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <a
            className="inline-flex min-h-11 items-center gap-2 text-xs text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            href="#admin/orders"
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
                    تعداد: {new Intl.NumberFormat('fa-IR').format(item.quantity)}
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
          <ReturnPanel canReview={canReviewReturns} onReview={openReturn} request={returnRequest} />
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
