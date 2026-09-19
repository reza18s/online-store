import { useState } from 'react';
import { type AdminCatalogProductVariant } from '@nova/api-client';
import { Button, Input as UiInput } from '@nova/ui';
import type { useUpdateAdminProductVariant } from '../../../lib/admin/admin-catalog-api';

import { Icon } from '../../ui/icon';

import { StatusBadge } from './status-badge';

import { formatDate } from './format-date';

export function VariantItem({
  variant,
  productId,
  canWrite,
  update,
}: {
  variant: AdminCatalogProductVariant;
  productId: string;
  canWrite: boolean;
  update: ReturnType<typeof useUpdateAdminProductVariant>;
}) {
  const [title, setTitle] = useState(variant.title ?? '');
  const [size, setSize] = useState(variant.size ?? '');
  const [color, setColor] = useState(variant.color ?? '');
  const [price, setPrice] = useState(variant.priceToman === null ? '' : String(variant.priceToman));
  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold" dir="ltr">
            {variant.sku}
          </span>
          <span className="ms-2">
            <StatusBadge status={variant.isActive ? 'ACTIVE' : 'INACTIVE'} />
          </span>
        </div>
        <a
          className="inline-flex min-h-10 items-center gap-1 text-[11px] text-primary focus-visible:outline-2 focus-visible:outline-primary"
          href={`#admin/inventory/${encodeURIComponent(variant.id)}`}
        >
          موجودی <Icon name="arrow-left" size={13} />
        </a>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <UiInput
          aria-label={`عنوان ${variant.sku}`}
          className="min-h-10 border border-border bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={!canWrite}
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
        <UiInput
          aria-label={`سایز ${variant.sku}`}
          className="min-h-10 border border-border bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={!canWrite}
          onChange={(event) => setSize(event.target.value)}
          value={size}
        />
        <UiInput
          aria-label={`رنگ ${variant.sku}`}
          className="min-h-10 border border-border bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={!canWrite}
          onChange={(event) => setColor(event.target.value)}
          value={color}
        />
        <UiInput
          aria-label={`قیمت ${variant.sku}`}
          className="min-h-10 border border-border bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          dir="ltr"
          disabled={!canWrite}
          inputMode="numeric"
          onChange={(event) => setPrice(event.target.value)}
          value={price}
        />
      </div>
      {canWrite ? (
        <Button
          className="mt-2"
          loading={update.isPending}
          onClick={() =>
            void update.mutateAsync({
              productId,
              variantId: variant.id,
              input: {
                title: title.trim() || null,
                size: size.trim() || null,
                color: color.trim() || null,
                priceToman: price.trim() ? Number(price) : null,
              },
            })
          }
          size="sm"
          variant="outline"
        >
          <Icon name="check" size={14} /> ذخیره تنوع
        </Button>
      ) : null}
      <p className="mt-2 text-[10px] text-muted-foreground">
        آخرین تغییر: {formatDate(variant.updatedAt)} · موجودی از نمای موجودی کنترل می‌شود.
      </p>
    </div>
  );
}
