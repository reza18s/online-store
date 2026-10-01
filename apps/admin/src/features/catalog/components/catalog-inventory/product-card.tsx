import { type AdminCatalogProductListItem } from '@nova/api-client';

import { MediaThumb } from '@/features/catalog/components/catalog-inventory/media-thumb';

import { StatusBadge } from '@/features/catalog/components/catalog-inventory/status-badge';

import { formatToman } from '@/shared/utils/format-toman';

export function ProductCard({ product }: { product: AdminCatalogProductListItem }) {
  return (
    <article className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-2 border border-border bg-background p-2">
      <MediaThumb
        src={product.primaryMedia?.url}
        alt={product.primaryMedia?.altText ?? product.name}
      />
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <a
            className="font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            href={`/admin/catalog/products/${encodeURIComponent(product.id)}`}
          >
            {product.name}
          </a>
          <StatusBadge status={product.status} />
        </div>
        <p className="mt-1 truncate text-[10px] text-muted-foreground" dir="ltr">
          {product.slug}
        </p>
        <dl className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1">
            <dt className="text-muted-foreground">قیمت:</dt>
            <dd>{formatToman(product.basePriceToman)}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="text-muted-foreground">موجودی:</dt>
            <dd>
              <StatusBadge status={product.inventory.status} />
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
