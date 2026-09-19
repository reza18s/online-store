import { type CartView, type CheckoutQuote } from '@nova/api-client';

import { Icon } from '../../ui/icon';

import { formatToman } from './format-toman';

export function OrderSummary({
  cart,
  quote,
}: {
  cart: CartView;
  quote: CheckoutQuote | undefined;
}) {
  const subtotal = quote?.subtotalToman ?? cart.subtotalToman;
  const discount = quote?.discountToman ?? 0;
  const total = quote?.totalToman ?? cart.subtotalToman;
  return (
    <aside className="summary-card checkout-summary" aria-label="خلاصه سفارش">
      <span className="section-heading__eyebrow">خلاصه سفارش</span>
      <h2>{new Intl.NumberFormat('fa-IR').format(cart.itemCount)} کالا</h2>
      <div>
        <span>مبلغ کالاها</span>
        <strong>{formatToman(subtotal)}</strong>
      </div>
      {quote && discount ? (
        <div>
          <span>تخفیف</span>
          <strong className="text-success">− {formatToman(discount)}</strong>
        </div>
      ) : null}
      <div>
        <span>ارسال</span>
        <strong>{quote ? formatToman(quote.shippingToman) : 'پس از تأیید آدرس'}</strong>
      </div>
      <div className="summary-card__total">
        <span>مبلغ نهایی</span>
        <strong>{quote ? formatToman(total) : 'پس از دریافت قیمت'}</strong>
      </div>
      {quote ? (
        <p className="mb-3 text-xs leading-7 text-muted-foreground">
          {quote.shippingLabel} · {quote.shippingEstimate}
        </p>
      ) : null}
      <a className="text-link" href="#cart">
        ویرایش سبد <Icon name="arrow-left" size={15} />
      </a>
    </aside>
  );
}
