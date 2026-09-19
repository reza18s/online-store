import { type AdminCatalogProductListItem } from '@nova/api-client';

import { MediaThumb } from './media-thumb';

import { StatusBadge } from './status-badge';

import { formatToman } from './format-toman';

export function ProductCard({ product }: { product: AdminCatalogProductListItem }) {
  return (
    <article className="border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <MediaThumb
          src={product.primaryMedia?.url}
          alt={product.primaryMedia?.altText ?? product.name}
        />
        <div className="min-w-0 flex-1">
          <a
            className="font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            href={`#admin/catalog/products/${encodeURIComponent(product.id)}`}
          >
            {product.name}
          </a>
          <p className="mt-1 truncate text-[10px] text-muted-foreground" dir="ltr">
            {product.slug}
          </p>
        </div>
        <StatusBadge status={product.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
        <div>
          <dt className="text-muted-foreground">قیمت</dt>
          <dd className="mt-1">{formatToman(product.basePriceToman)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">موجودی</dt>
          <dd className="mt-1">
            <StatusBadge status={product.inventory.status} />
          </dd>
        </div>
      </dl>
    </article>
  );
}
