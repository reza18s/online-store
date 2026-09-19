import { useState } from 'react';

import { type StorefrontProduct } from '../../../lib/catalog/catalog-api';
import { useAddCartItem } from '../../../lib/cart/cart-api';

export function useProductAdder() {
  const mutation = useAddCartItem();
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean }>();
  const add = (product: StorefrontProduct) => {
    const variant = product.selectedVariantId
      ? product.variants?.find((item) => item.id === product.selectedVariantId)
      : product.variants?.find((item) => item.available);
    if (!variant || !variant.available) {
      setFeedback({ message: 'این محصول بدون انتخاب تنوع قابل افزودن نیست.', error: true });
      return;
    }
    mutation.mutate(
      { variantId: variant.id, quantity: 1, idempotencyKey: globalThis.crypto?.randomUUID?.() },
      {
        onSuccess: () => setFeedback({ message: `«${product.name}» به سبد خرید اضافه شد.` }),
        onError: (error) =>
          setFeedback({
            message: error instanceof Error ? error.message : 'افزودن کالا به سبد ممکن نشد.',
            error: true,
          }),
      },
    );
  };
  return { add, feedback, isPending: mutation.isPending };
}
