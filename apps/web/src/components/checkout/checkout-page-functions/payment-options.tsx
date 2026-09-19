import { Radio } from '@nova/ui';

import { Icon } from '../../ui/icon';

export function PaymentOptions() {
  return (
    <fieldset className="option-list">
      <legend className="mb-3 text-sm font-semibold">روش پرداخت</legend>
      <label className="option-card is-selected">
        <Radio name="payment" defaultChecked aria-label="پرداخت آنلاین" />
        <span>
          <strong>پرداخت آنلاین</strong>
          <small>پس از ثبت امن سفارش، در صورت فعال‌بودن درگاه به آن منتقل می‌شوید.</small>
        </span>
        <Icon name="check" size={18} />
      </label>
      <div className="inline-message inline-message--info" role="status">
        <Icon name="info" size={16} />
        وضعیت پرداخت پس از بازگشت، فقط از روی سفارش معتبر سرور نمایش داده می‌شود.
      </div>
    </fieldset>
  );
}
