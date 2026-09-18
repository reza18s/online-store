import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ReactElement } from 'react';

import { QueryClient } from '@tanstack/react-query';
import { ApiClientError, queryKeys } from '@nova/api-client';

import { createQueryClient, mountApp, seedInitialRenderData } from './main';

const seo = {
  title: 'NOVA',
  description: 'توضیح نوا',
  canonicalUrl: 'https://nova.example/',
  robots: 'index, follow' as const,
  openGraph: { type: 'website' as const, imageUrl: null },
  jsonLd: null,
};

test('hydrates SSR roots and creates a root for client-only markup', () => {
  const calls: string[] = [];
  let handoff: ReactElement<{ shellHtml: string }> | undefined;
  const renderers = {
    create: () => calls.push('create'),
    hydrate: (_root: HTMLElement, app: unknown) => {
      calls.push('hydrate');
      handoff = app as ReactElement<{ shellHtml: string }>;
    },
  };

  mountApp(
    {
      dataset: { novaSsr: 'true' },
      firstElementChild: {
        getAttribute: (name: string) => (name === 'data-nova-ssr-shell' ? 'true' : null),
        innerHTML: '<main data-nova-ssr-content="true"><h1>SSR</h1></main>',
      },
    } as unknown as HTMLElement,
    renderers,
  );
  mountApp({ dataset: {}, firstElementChild: null } as unknown as HTMLElement, renderers);

  assert.deepEqual(calls, ['hydrate', 'create']);
  assert.equal(handoff?.props.shellHtml, '<main data-nova-ssr-content="true"><h1>SSR</h1></main>');
});

test('seeds SSR public data under the same query keys used by the app', () => {
  const queryClient = new QueryClient();
  const categories = [{ id: 'women', slug: 'women', name: 'زنانه' }];
  const products = { items: [], total: 0, page: 1, limit: 8 };

  seedInitialRenderData(queryClient, {
    path: '/category/women',
    hashRoute: '#category/women',
    seo,
    initialData: { kind: 'category', audience: 'women', categories, products },
  });

  assert.deepEqual(queryClient.getQueryData(queryKeys.catalog.categories()), categories);
  assert.deepEqual(
    queryClient.getQueryData(
      queryKeys.catalog.products({ audience: 'women', limit: 8, sort: 'newest' }),
    ),
    products,
  );
  assert.equal(
    queryClient.getQueryData(
      queryKeys.catalog.products({ audience: 'women', limit: 4, sort: 'newest' }),
    ),
    undefined,
  );
  queryClient.clear();
});

test('clears protected cache and redirects on session failure, not role denial', async () => {
  let expiredCount = 0;
  const queryClient = createQueryClient({
    isDevelopment: false,
    onStaffSessionExpired: () => {
      expiredCount += 1;
    },
  });
  queryClient.setQueryData(['staff-auth', 'current'], { id: 'staff-data' });
  queryClient.setQueryData(['admin', 'orders'], { id: 'admin-data' });
  queryClient.setQueryData(['account', 'current'], { id: 'customer-data' });
  queryClient.setQueryData(['cart', 'current'], { id: 'cart-data' });

  await assert.rejects(
    queryClient.fetchQuery({
      queryKey: ['admin', 'orders'],
      queryFn: async () => {
        throw new ApiClientError(401);
      },
      staleTime: 0,
      retry: false,
    }),
  );

  assert.equal(expiredCount, 1);
  assert.equal(queryClient.getQueryData(['staff-auth', 'current']), undefined);
  assert.equal(queryClient.getQueryData(['admin', 'orders']), undefined);
  assert.deepEqual(queryClient.getQueryData(['account', 'current']), { id: 'customer-data' });
  assert.deepEqual(queryClient.getQueryData(['cart', 'current']), { id: 'cart-data' });

  queryClient.setQueryData(['staff-auth', 'current'], { id: 'staff-data' });
  queryClient.setQueryData(['admin', 'orders'], { id: 'admin-data' });
  const sessionExpiredMutation = queryClient.getMutationCache().build(queryClient, {
    mutationKey: ['admin', 'orders'],
    mutationFn: async () => {
      throw new ApiClientError(401);
    },
  });

  await assert.rejects(sessionExpiredMutation.execute(undefined));
  assert.equal(expiredCount, 2);
  assert.equal(queryClient.getQueryData(['staff-auth', 'current']), undefined);
  assert.equal(queryClient.getQueryData(['admin', 'orders']), undefined);
  assert.equal(queryClient.getMutationCache().findAll().length, 0);

  queryClient.setQueryData(['staff-auth', 'current'], { id: 'staff-data' });
  queryClient.setQueryData(['admin', 'orders'], { id: 'admin-data' });
  const roleDenied = queryClient.getMutationCache().build(queryClient, {
    mutationKey: ['admin', 'orders'],
    mutationFn: async () => {
      throw new ApiClientError(403);
    },
  });

  await assert.rejects(roleDenied.execute(undefined));
  assert.equal(expiredCount, 2);
  assert.deepEqual(queryClient.getQueryData(['staff-auth', 'current']), { id: 'staff-data' });
  assert.deepEqual(queryClient.getQueryData(['admin', 'orders']), { id: 'admin-data' });
  assert.equal(queryClient.getMutationCache().findAll().length, 1);
  queryClient.clear();
});
