import { type AdminOrderDetail } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '../../ui/icon';

import type { AdminFulfillmentOrderStatus } from '../../../pages/admin/admin-orders-page-shared';
import {
  FULFILLMENT_STATUS_OPTIONS,
  SHIPMENT_STATUS_LABELS,
} from '../../../pages/admin/admin-orders-page-shared';

import { PanelHeading } from './panel-heading';

import { StatusChip } from './status-chip';

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
