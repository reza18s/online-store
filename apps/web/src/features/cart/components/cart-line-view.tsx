import { type CartLine } from '@nova/api-client';
import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

import { cartLineAvailability } from '@/features/cart/components/cart-line-availability';

import { formatToman } from '@/shared/utils/format-toman';

export function CartLineView({
  line,
  busy,
  onUpdate,
  onRemove,
}: {
  line: CartLine;
  busy: boolean;
  onUpdate: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
}) {
  const unavailable = cartLineAvailability(line) === 'unavailable';
  return (
    <article className="cart-line">
      <a
        className="cart-line__media"
        href={`/product/${encodeURIComponent(line.productSlug)}`}
        aria-label={`مشاهده ${line.productName}`}
      >
        {line.imageUrl ? (
          <img src={line.imageUrl}
            alt={line.imageAlt ?? line.productName}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-primary">
            <Icon name="shirt" size={28} />
          </span>
        )}
      </a>
      <div className="cart-line__body">
        <span className="cart-line__sku" dir="ltr">
          {line.sku}
        </span>
        <a
          className="cart-line__title"
          href={`/product/${encodeURIComponent(line.productSlug)}`}
        >
          {line.productName}
        </a>
        <p className="cart-line__variant">{line.title ?? 'تنوع انتخاب‌شده'}</p>
        <div className="cart-line__controls">
          <strong className="cart-line__price">{formatToman(line.unitPriceToman)}</strong>
          <div
            className="quantity-stepper"
            aria-label={`تعداد ${line.productName}`}
          >
            <Button
              className="quantity-stepper__button"
              type="button"
              aria-label="کاهش تعداد"
              disabled={busy || line.quantity <= 1}
              onClick={() => onUpdate(line.variantId, line.quantity - 1)}
            >
              −
            </Button>
            <span className="quantity-stepper__value" aria-live="polite">
              {formatPersianNumber(line.quantity)}
            </span>
            <Button
              className="quantity-stepper__button"
              type="button"
              aria-label="افزایش تعداد"
              disabled={busy || line.quantity >= 99}
              onClick={() => onUpdate(line.variantId, line.quantity + 1)}
            >
              +
            </Button>
          </div>
        </div>
        {unavailable ? (
          <p className="cart-line__warning">
            این تنوع دیگر موجود نیست و هنگام پرداخت قابل انتخاب نخواهد بود.
          </p>
        ) : null}
      </div>
      <Button
        className="icon-button cart-line__remove"
        type="button"
        disabled={busy}
        aria-label={`حذف ${line.productName}`}
        onClick={() => onRemove(line.variantId)}
      >
        <Icon name="close" size={17} />
      </Button>
    </article>
  );
}
