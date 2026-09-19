import { useEffect, useState, type FormEvent } from 'react';
import {
  type AdminCatalogProductCreateInput,
  type AdminCatalogProductListItem,
} from '@nova/api-client';
import { Button, Input as UiInput, Textarea as UiTextarea } from '@nova/ui';
import {
  useAdminCatalogCategories,
  useAdminCatalogProduct,
  useAdminProductCategories,
  useAdminProductMedia,
  useAdminProductOptions,
  useAdminProductVariants,
  useCreateAdminCatalogProduct,
  useReplaceAdminProductCategories,
  useUpdateAdminCatalogProduct,
  useUpdateAdminCatalogProductStatus,
} from '../../../lib/admin/admin-catalog-api';

import { Icon } from '../../ui/icon';

import type { ProductDraftValues } from '../../../pages/admin/admin-catalog-inventory-page-shared';

import { LoadingState } from './loading-state';

import { MediaPanel } from './media-panel';

import { MutationStateBadge } from './mutation-state-badge';

import { OptionsPanel } from './options-panel';

import { PermissionPanel } from './permission-panel';

import { QueryState } from './query-state';

import { StatePanel } from './state-panel';

import { StatusBadge } from './status-badge';

import { TaxonomyPanel } from './taxonomy-panel';

import { VariantsPanel } from './variants-panel';

import { adminCatalogInventoryErrorMessage } from './admin-catalog-inventory-error-message';

import { formatDate } from './format-date';

import { hasAdminRole } from './has-admin-role';

import { ltr } from './ltr';

import { mutationStateLabel } from './mutation-state-label';

import { resolveAdminMutationState } from './resolve-admin-mutation-state';

import { validateProductDraft } from './validate-product-draft';

export function ProductEditor({
  roles,
  productId,
}: {
  roles: readonly string[];
  productId?: string;
}) {
  const canWrite = hasAdminRole(roles, ['admin']);
  const [localProductId, setLocalProductId] = useState(productId ?? '');
  const [createdProduct, setCreatedProduct] = useState<AdminCatalogProductListItem | null>(null);
  const effectiveProductId = createdProduct?.id ?? localProductId;
  const productQuery = useAdminCatalogProduct(productId ?? '', Boolean(productId));
  const product = createdProduct ?? productQuery.data;
  const categoriesQuery = useAdminCatalogCategories();
  const productCategoriesQuery = useAdminProductCategories(effectiveProductId);
  const optionsQuery = useAdminProductOptions(effectiveProductId);
  const variantsQuery = useAdminProductVariants(effectiveProductId);
  const mediaQuery = useAdminProductMedia(effectiveProductId);
  const createProductMutation = useCreateAdminCatalogProduct();
  const updateProductMutation = useUpdateAdminCatalogProduct();
  const statusMutation = useUpdateAdminCatalogProductStatus();
  const replaceCategoriesMutation = useReplaceAdminProductCategories();
  const [draft, setDraft] = useState<ProductDraftValues>({
    slug: '',
    name: '',
    shortDescription: '',
    description: '',
    brand: '',
    basePriceToman: '',
    compareAtPriceToman: '',
  });
  const [loadedKey, setLoadedKey] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const isCreate = !effectiveProductId;
  const validationIssues = validateProductDraft(draft, isCreate ? 'create' : 'edit');
  const publishBlockers = validationIssues;
  const isProductDirty =
    isCreate ||
    !product ||
    draft.name.trim() !== product.name ||
    Number(draft.basePriceToman) !== product.basePriceToman ||
    draft.compareAtPriceToman.trim() !==
      (product.compareAtPriceToman === null ? '' : String(product.compareAtPriceToman));
  const mutationState = resolveAdminMutationState({
    isDirty: isProductDirty,
    isPending: createProductMutation.isPending || updateProductMutation.isPending,
    isError: createProductMutation.isError || updateProductMutation.isError,
    isSuccess: createProductMutation.isSuccess || updateProductMutation.isSuccess,
    hasInvalidFields: validationIssues.length > 0,
    hasPublishBlockers: !isCreate && publishBlockers.length > 0,
  });

  useEffect(() => {
    if (!product) return;
    const key = `${product.id}:${product.updatedAt}`;
    if (key === loadedKey) return;
    setDraft({
      slug: product.slug,
      name: product.name,
      shortDescription: '',
      description: '',
      brand: '',
      basePriceToman: String(product.basePriceToman),
      compareAtPriceToman:
        product.compareAtPriceToman === null ? '' : String(product.compareAtPriceToman),
    });
    setLoadedKey(key);
  }, [loadedKey, product]);
  useEffect(() => {
    if (productCategoriesQuery.data)
      setSelectedCategoryIds(productCategoriesQuery.data.map((category) => category.id));
  }, [productCategoriesQuery.data]);

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validationIssues.length) {
      setError(validationIssues.join(' '));
      return;
    }
    setError('');
    try {
      if (isCreate) {
        const input: AdminCatalogProductCreateInput = {
          slug: draft.slug.trim(),
          name: draft.name.trim(),
          shortDescription: draft.shortDescription.trim() || null,
          description: draft.description.trim() || null,
          brand: draft.brand.trim() || null,
          basePriceToman: Number(draft.basePriceToman),
          compareAtPriceToman: draft.compareAtPriceToman.trim()
            ? Number(draft.compareAtPriceToman)
            : null,
        };
        const created = await createProductMutation.mutateAsync(input);
        setCreatedProduct({
          ...created,
          categories: [],
          primaryMedia: null,
          inventory: {
            available: 0,
            lowStockVariantCount: 0,
            outOfStockVariantCount: 0,
            status: 'OUT_OF_STOCK',
          },
          variantCount: 0,
          mediaCount: 0,
        });
        setLocalProductId(created.id);
      } else {
        if (!product) return;
        await updateProductMutation.mutateAsync({
          productId: product.id,
          input: {
            ...(draft.name.trim() !== product.name ? { name: draft.name.trim() } : {}),
            ...(Number(draft.basePriceToman) !== product.basePriceToman
              ? { basePriceToman: Number(draft.basePriceToman) }
              : {}),
            ...(draft.compareAtPriceToman.trim() !==
            (product.compareAtPriceToman === null ? '' : String(product.compareAtPriceToman))
              ? {
                  compareAtPriceToman: draft.compareAtPriceToman.trim()
                    ? Number(draft.compareAtPriceToman)
                    : null,
                }
              : {}),
          },
        });
      }
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'محصول ذخیره نشد.'));
    }
  }
  async function setProductStatus(status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    if (!product || publishBlockers.length) {
      setError('انتشار تا رفع خطاهای فرم مسدود است.');
      return;
    }
    setError('');
    try {
      await statusMutation.mutateAsync({ productId: product.id, input: { status } });
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'وضعیت محصول تغییر نکرد.'));
    }
  }
  async function saveCategories() {
    if (!effectiveProductId) return;
    setError('');
    try {
      await replaceCategoriesMutation.mutateAsync({
        productId: effectiveProductId,
        input: { categoryIds: selectedCategoryIds },
      });
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'دسته‌بندی محصول ذخیره نشد.'));
    }
  }

  if (!canWrite && !hasAdminRole(roles, ['support', 'operations', 'admin']))
    return <PermissionPanel title="دسترسی مشاهده کاتالوگ ندارید" />;
  if (!isCreate && productQuery.isPending && !product)
    return <LoadingState label="در حال دریافت محصول..." />;
  if (!isCreate && productQuery.isError && !product)
    return (
      <QueryState
        pending={false}
        error={productQuery.error}
        hasData={false}
        onRetry={() => void productQuery.refetch()}
      >
        {null}
      </QueryState>
    );
  if (!isCreate && !product)
    return (
      <StatePanel
        icon="bag"
        title="محصول پیدا نشد"
        description="شناسه محصول در سرویس مدیریت وجود ندارد یا دسترسی مشاهده آن محدود شده است."
        tone="danger"
      />
    );
  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <a
            className="inline-flex min-h-11 items-center gap-2 text-xs text-primary focus-visible:outline-2 focus-visible:outline-primary"
            href="#admin/catalog"
          >
            <Icon name="arrow-right" size={16} /> بازگشت به محصولات
          </a>
          <p className="mt-3 text-[10px] font-semibold tracking-[0.16em] text-primary">
            CATALOG / PRODUCT EDITOR
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{isCreate ? 'محصول جدید' : product?.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isCreate ? (
              'اطلاعات پایه را ثبت کنید؛ تنوع و رسانه پس از ذخیره فعال می‌شود.'
            ) : (
              <>
                آخرین تغییر: {formatDate(product?.updatedAt)} ·{' '}
                {ltr(product?.id ?? effectiveProductId)}
              </>
            )}
          </p>
        </div>
        {product ? (
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={product.status} />
            {canWrite ? (
              <>
                <Button
                  disabled={statusMutation.isPending || publishBlockers.length > 0}
                  loading={statusMutation.isPending}
                  onClick={() =>
                    void setProductStatus(product.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')
                  }
                  variant="outline"
                >
                  {product.status === 'PUBLISHED' ? 'بازگشت به پیش‌نویس' : 'انتشار'}
                </Button>
                <Button
                  disabled={statusMutation.isPending}
                  onClick={() => void setProductStatus('ARCHIVED')}
                  variant="ghost"
                >
                  آرشیو
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
      </header>
      {error ? (
        <p
          className="border border-destructive/30 bg-error-soft px-4 py-3 text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <form
        className="border border-border bg-surface p-4 shadow-card md:p-5"
        onSubmit={saveProduct}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 className="font-semibold">اطلاعات پایه</h3>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {mutationStateLabel(mutationState)}
            </p>
          </div>
          <MutationStateBadge state={mutationState} />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-xs text-muted-foreground">
            شناسه محصول
            <span className="relative mt-2 block">
              <UiInput
                className="min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-secondary"
                dir="ltr"
                disabled={!isCreate || !canWrite}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, slug: event.target.value }))
                }
                value={draft.slug}
              />
            </span>
          </label>
          <label className="text-xs text-muted-foreground">
            نام محصول
            <UiInput
              className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={!canWrite}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
              value={draft.name}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            قیمت پایه (تومان)
            <UiInput
              className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              dir="ltr"
              disabled={!canWrite}
              inputMode="numeric"
              onChange={(event) =>
                setDraft((current) => ({ ...current, basePriceToman: event.target.value }))
              }
              value={draft.basePriceToman}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            قیمت قبل (اختیاری)
            <UiInput
              className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              dir="ltr"
              disabled={!canWrite}
              inputMode="numeric"
              onChange={(event) =>
                setDraft((current) => ({ ...current, compareAtPriceToman: event.target.value }))
              }
              value={draft.compareAtPriceToman}
            />
          </label>
          {isCreate ? (
            <>
              <label className="text-xs text-muted-foreground">
                برند
                <UiInput
                  className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={!canWrite}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, brand: event.target.value }))
                  }
                  value={draft.brand}
                />
              </label>
              <label className="text-xs text-muted-foreground md:col-span-2">
                توضیح کوتاه
                <UiTextarea
                  className="mt-2 min-h-20 w-full border border-border bg-background px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={!canWrite}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, shortDescription: event.target.value }))
                  }
                  value={draft.shortDescription}
                />
              </label>
              <label className="text-xs text-muted-foreground md:col-span-2">
                توضیحات
                <UiTextarea
                  className="mt-2 min-h-28 w-full border border-border bg-background px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={!canWrite}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, description: event.target.value }))
                  }
                  value={draft.description}
                />
              </label>
            </>
          ) : null}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {canWrite ? (
            <Button
              loading={createProductMutation.isPending || updateProductMutation.isPending}
              type="submit"
            >
              <Icon name="check" size={16} /> ذخیره محصول
            </Button>
          ) : null}
          {validationIssues.length ? (
            <span className="text-xs text-destructive">{validationIssues[0]}</span>
          ) : null}
        </div>
      </form>
      {effectiveProductId ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <TaxonomyPanel
            categories={categoriesQuery.data ?? []}
            selectedIds={selectedCategoryIds}
            canWrite={canWrite}
            onToggle={(id) =>
              setSelectedCategoryIds((current) =>
                current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
              )
            }
            onSave={saveCategories}
            saving={replaceCategoriesMutation.isPending}
          />
          <OptionsPanel productId={effectiveProductId} query={optionsQuery} canWrite={canWrite} />
        </div>
      ) : null}
      {effectiveProductId ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <VariantsPanel
            productId={effectiveProductId}
            query={variantsQuery}
            options={optionsQuery.data ?? []}
            canWrite={canWrite}
          />
          <MediaPanel productId={effectiveProductId} query={mediaQuery} canWrite={canWrite} />
        </div>
      ) : null}
    </div>
  );
}
