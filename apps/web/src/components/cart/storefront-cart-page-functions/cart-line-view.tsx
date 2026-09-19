import { type CartLine } from '@nova/api-client';
import { Button } from '@nova/ui';
import { Icon } from '../../ui/icon';

import { cartLineAvailability } from './cart-line-availability';

import { formatToman } from './format-toman';

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
    <article className="grid grid-cols-[80px_minmax(0,1fr)_44px] gap-3 border-b border-border pb-4 md:grid-cols-[104px_minmax(0,1fr)_44px] md:gap-4">
      <a
        className="aspect-[4/5] overflow-hidden rounded-control bg-secondary"
        href={`#product/${encodeURIComponent(line.productSlug)}`}
        aria-label={`مشاهده ${line.productName}`}
      >
        {line.imageUrl ? (
          <img
            className="h-full w-full object-cover"
            src={line.imageUrl}
            alt={line.imageAlt ?? line.productName}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-primary">
            <Icon name="shirt" size={28} />
          </span>
        )}
      </a>
      <div className="min-w-0 space-y-1">
        <span className="block font-mono text-[10px] text-muted-foreground" dir="ltr">
          {line.sku}
        </span>
        <a
          className="block text-sm font-semibold leading-6 hover:text-primary"
          href={`#product/${encodeURIComponent(line.productSlug)}`}
        >
          {line.productName}
        </a>
        <p className="text-xs text-muted-foreground">{line.title ?? 'تنوع انتخاب‌شده'}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
          <strong className="text-sm text-primary">{formatToman(line.unitPriceToman)}</strong>
          <div
            className="inline-flex min-h-11 items-center border border-border bg-background"
            aria-label={`تعداد ${line.productName}`}
          >
            <Button
              className="min-h-11 min-w-11 text-lg text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              aria-label="کاهش تعداد"
              disabled={busy || line.quantity <= 1}
              onClick={() => onUpdate(line.variantId, line.quantity - 1)}
            >
              −
            </Button>
            <span className="min-w-8 text-center text-xs" aria-live="polite">
              {new Intl.NumberFormat('fa-IR').format(line.quantity)}
            </span>
            <Button
              className="min-h-11 min-w-11 text-lg text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
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
          <p className="text-xs text-warning">
            این تنوع دیگر موجود نیست و هنگام پرداخت قابل انتخاب نخواهد بود.
          </p>
        ) : null}
      </div>
      <Button
        className="icon-button"
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
