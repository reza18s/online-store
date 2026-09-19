import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { readInitialRenderContext, type InitialRenderContext } from '../../lib/seo/metadata';

export function seedInitialRenderData(
  queryClient: QueryClient,
  context: InitialRenderContext | undefined = readInitialRenderContext(),
): void {
  const data = context?.initialData;
  if (!data) return;

  switch (data.kind) {
    case 'home':
      queryClient.setQueryData(
        queryKeys.catalog.products({ limit: 8, sort: 'newest' }),
        data.products,
      );
      return;
    case 'category':
      queryClient.setQueryData(queryKeys.catalog.categories(), data.categories);
      queryClient.setQueryData(
        queryKeys.catalog.products({ audience: data.audience, limit: 8, sort: 'newest' }),
        data.products,
      );
      return;
    case 'product':
      queryClient.setQueryData(queryKeys.catalog.product(data.product.slug), data.product);
      return;
    case 'content':
      queryClient.setQueryData(queryKeys.content.page(data.page.slug), data.page);
      return;
  }
}
