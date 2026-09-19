import { type CheckoutQuote, type CheckoutShippingMethod } from '@nova/api-client';
import { Radio } from '@nova/ui';

import { formatToman } from './format-toman';

export function ShippingOptions({
  value,
  onChange,
  quote,
}: {
  value: CheckoutShippingMethod;
  onChange: (value: CheckoutShippingMethod) => void;
  quote: CheckoutQuote | undefined;
}) {
  return (
    <fieldset className="option-list">
      <legend className="mb-3 text-sm font-semibold">روش ارسال را انتخاب کنید</legend>
      {(['STANDARD', 'EXPRESS'] as CheckoutShippingMethod[]).map((method) => (
        <label className={`option-card ${value === method ? 'is-selected' : ''}`} key={method}>
          <Radio checked={value === method} name="shipping" onChange={() => onChange(method)} />
          <span>
            <strong>{method === 'STANDARD' ? 'ارسال عادی' : 'ارسال سریع'}</strong>
            <small>
              {value === method && quote
                ? `${quote.shippingEstimate} · ${quote.shippingLabel}`
                : 'هزینه و زمان تحویل پس از بررسی آدرس از سرور دریافت می‌شود.'}
            </small>
          </span>
          {value === method && quote ? <b>{formatToman(quote.shippingToman)}</b> : null}
        </label>
      ))}
    </fieldset>
  );
}
