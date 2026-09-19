import { Button } from '@nova/ui';
import { Icon } from '../../ui/icon';
import { type StorefrontProduct } from '../../../lib/catalog/catalog-api';

import { formatToman } from './format-toman';

export function RecommendationCard({
  product,
  onAdd,
  busy,
}: {
  product: StorefrontProduct;
  onAdd: (product: StorefrontProduct) => void;
  busy: boolean;
}) {
  const variant = product.variants?.find((item) => item.available);
  const disabled = !variant || product.available === false || busy;
  return (
    <article className="min-w-0">
      <a
        className="block aspect-square overflow-hidden rounded-editorial bg-secondary"
        href={`#product/${encodeURIComponent(product.slug)}`}
        aria-label={`مشاهده ${product.name}`}
      >
        {product.image ? (
          <img
            className="h-full w-full object-cover"
            src={product.image}
            alt={product.alt}
            loading="lazy"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground">
            <Icon name="shirt" size={25} />
          </span>
        )}
      </a>
      <div className="pt-2">
        <a
          className="block text-sm font-semibold leading-6 hover:text-primary"
          href={`#product/${encodeURIComponent(product.slug)}`}
        >
          {product.name}
        </a>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs text-primary">{formatToman(product.price)}</span>
          <Button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
            type="button"
            disabled={disabled}
            aria-label={
              disabled ? `${product.name} قابل افزودن نیست` : `افزودن ${product.name} به سبد`
            }
            onClick={() => onAdd(product)}
          >
            <Icon name="plus" size={16} />
          </Button>
        </div>
      </div>
    </article>
  );
}
