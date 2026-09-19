import { type AdminOrderDetail } from '@nova/api-client';

import { PanelHeading } from './panel-heading';

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
