import { type AdminCatalogProductListItem } from '@nova/api-client';

import { Icon } from '../../ui/icon';

import { MediaThumb } from './media-thumb';

import { StatusBadge } from './status-badge';

import { formatNumber } from './format-number';

import { formatToman } from './format-toman';

export function ProductTableRow({ product }: { product: AdminCatalogProductListItem }) {
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-background">
      <td className="px-4 py-4 align-top">
        <a
          className="flex min-h-11 items-center gap-3 rounded-control focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          href={`#admin/catalog/products/${encodeURIComponent(product.id)}`}
        >
          <MediaThumb
            src={product.primaryMedia?.url}
            alt={product.primaryMedia?.altText ?? product.name}
          />
          <span>
            <span className="block font-semibold">{product.name}</span>
            <span className="mt-1 block text-[10px] text-muted-foreground" dir="ltr">
              {product.slug}
            </span>
          </span>
        </a>
      </td>
      <td className="px-4 py-4 align-top text-muted-foreground">
        {product.categories.length
          ? product.categories.map((category) => category.name).join('، ')
          : 'بدون دسته'}
      </td>
      <td className="px-4 py-4 align-top whitespace-nowrap">
        {formatToman(product.basePriceToman)}
      </td>
      <td className="px-4 py-4 align-top">
        <StatusBadge status={product.inventory.status} />
        <span className="mt-1 block text-[10px] text-muted-foreground">
          {formatNumber(product.inventory.available)} قابل فروش
        </span>
      </td>
      <td className="px-4 py-4 align-top">
        <StatusBadge status={product.status} />
      </td>
      <td className="px-4 py-4 align-top">
        <a
          aria-label={`ویرایش ${product.name}`}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-primary hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          href={`#admin/catalog/products/${encodeURIComponent(product.id)}`}
        >
          <Icon name="edit" size={17} />
        </a>
      </td>
    </tr>
  );
}
