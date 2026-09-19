import { type CustomerOrderDetail } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '../../ui/icon';

import { formatToman } from './format-toman';

export function ConfirmationBody({ order }: { order: CustomerOrderDetail }) {
  return (
    <section className="confirmation-card" aria-labelledby="checkout-confirmation-title">
      <span className="confirmation-card__icon" aria-hidden="true">
        <Icon name="check" size={28} />
      </span>
      <span className="section-heading__eyebrow">NOVA / ORDER CONFIRMED</span>
      <h1 id="checkout-confirmation-title">سفارش شما با موفقیت تأیید شد</h1>
      <p>جزئیات زیر از سفارش ثبت‌شده در حساب شما دریافت شده است.</p>
      <strong className="ltr-value" dir="ltr">
        {order.orderNumber}
      </strong>
      <div className="mt-5 grid gap-2 border-y border-border py-4 text-sm">
        <div className="flex justify-between gap-4">
          <span>وضعیت پرداخت</span>
          <strong>پرداخت‌شده</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span>مبلغ نهایی</span>
          <strong>{formatToman(order.totalToman)}</strong>
        </div>
      </div>
      <div className="confirmation-card__actions">
        <Button asChild size="lg">
          <a href={`#order/${encodeURIComponent(order.orderNumber)}`}>پیگیری سفارش</a>
        </Button>
        <a className="text-link" href="#home">
          بازگشت به خانه <Icon name="arrow-left" size={16} />
        </a>
      </div>
    </section>
  );
}
