import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { test } from 'node:test';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClientError, queryKeys } from '@nova/api-client';
import type { ContentPage } from '@nova/api-client';

import {
  classifyContentError,
  getPublicContentState,
  getRenderableContentBlocks,
  isPublishedContentPage,
  normalizePublicContentSlug,
  publicContentHashHref,
  publicContentPath,
  PublicContentSystemPage,
  safeSiteRelativeHref,
} from './public-content-system-page';

const page = {
  slug: 'shipping-policy',
  title: 'راهنمای ارسال',
  body: 'ارسال سراسری نوا با بسته‌بندی دقیق انجام می‌شود.',
  blocks: [
    { kind: 'heading', payload: { text: 'زمان ارسال', level: 2 }, sortOrder: 2 },
    { kind: 'paragraph', payload: { text: 'سفارش‌ها پس از تأیید آماده می‌شوند.' }, sortOrder: 1 },
    {
      kind: 'link',
      payload: { label: 'مشاهده راهنمای اندازه', href: '/content/size guide?from=help' },
      sortOrder: 3,
    },
  ],
} satisfies ContentPage;

function query(data?: ContentPage) {
  return { isPending: false, isError: false, data };
}

function renderPage(
  client: QueryClient,
  props: { slug: string; systemState?: 'offline' | 'maintenance' },
) {
  return renderToStaticMarkup(
    createElement(QueryClientProvider, { client }, createElement(PublicContentSystemPage, props)),
  );
}

test('normalizes published slugs and keeps canonical/hash links encoded', () => {
  assert.equal(normalizePublicContentSlug(' Shipping-Policy '), 'shipping-policy');
  assert.equal(normalizePublicContentSlug('%20Shipping-Policy%20'), 'shipping-policy');
  assert.equal(normalizePublicContentSlug('shipping%2Dpolicy'), 'shipping-policy');
  assert.equal(normalizePublicContentSlug('../admin'), null);
  assert.equal(publicContentPath(' Shipping-Policy '), '/content/shipping-policy');
  assert.equal(publicContentHashHref(' Shipping-Policy '), '#content/shipping-policy');
  assert.equal(publicContentPath('../admin'), null);
});

test('accepts only site-relative links and encodes path text safely', () => {
  assert.equal(safeSiteRelativeHref('/category/زنانه'), '/category/%D8%B2%D9%86%D8%A7%D9%86%D9%87');
  assert.equal(
    safeSiteRelativeHref('/content/size guide?from=help'),
    '/content/size%20guide?from=help',
  );
  assert.equal(safeSiteRelativeHref('https://evil.example/steal'), null);
  assert.equal(safeSiteRelativeHref('//evil.example/steal'), null);
  assert.equal(safeSiteRelativeHref('/a/../admin'), null);
  assert.equal(safeSiteRelativeHref('/content/size\\guide'), null);
});

test('renders supported blocks in sort order and counts unsupported or unsafe blocks', () => {
  const result = getRenderableContentBlocks([
    { kind: 'paragraph', payload: { text: 'دوم' }, sortOrder: 2 },
    { kind: 'link', payload: { label: 'ناامن', href: 'javascript:alert(1)' }, sortOrder: 1 },
    { kind: 'heading', payload: { text: 'اول' }, sortOrder: 0 },
    { kind: 'html', payload: '<strong>نباید اجرا شود</strong>', sortOrder: 3 },
  ]);
  assert.deepEqual(
    result.blocks.map((block) => block.kind),
    ['heading', 'text'],
  );
  assert.deepEqual(
    result.blocks.map((block) => ('text' in block ? block.text : '')),
    ['اول', 'دوم'],
  );
  assert.equal(result.unsupportedCount, 2);
  assert.equal(
    getRenderableContentBlocks(
      Array.from({ length: 13 }, () => ({ kind: 'text', payload: 'متن', sortOrder: 0 })),
    ).unsupportedCount,
    1,
  );
});

test('classifies missing, offline, maintenance, and API failures without treating success as fake content', () => {
  const notFound = new ApiClientError(404);
  const unavailable = new ApiClientError(503);
  assert.equal(classifyContentError(notFound), 'missing');
  assert.equal(classifyContentError(unavailable), 'maintenance');
  assert.equal(classifyContentError(new TypeError('Failed to fetch')), 'offline');
  assert.equal(classifyContentError(new Error('unexpected response')), 'error');
  assert.equal(getPublicContentState({ slug: 'bad/route', query: query(page) }), 'invalid-route');
  assert.equal(
    getPublicContentState({ slug: page.slug, query: { isPending: true, isError: false } }),
    'loading',
  );
  assert.equal(
    getPublicContentState({
      slug: page.slug,
      query: { isPending: false, isError: true, error: notFound },
    }),
    'missing',
  );
  assert.equal(
    getPublicContentState({ slug: page.slug, query: query({ ...page, body: null, blocks: [] }) }),
    'empty',
  );
  assert.equal(
    getPublicContentState({
      slug: page.slug,
      query: query({ ...page, body: null, blocks: [{ kind: 'video', payload: {}, sortOrder: 0 }] }),
    }),
    'unsupported',
  );
});

test('validates the published response shape before rendering it', () => {
  assert.equal(isPublishedContentPage(page, page.slug), true);
  assert.equal(isPublishedContentPage({ ...page, slug: 'draft-page' }, page.slug), false);
  assert.equal(isPublishedContentPage({ ...page, blocks: null }, page.slug), false);
});

test('renders loading, offline, missing, and published states with safe next actions', () => {
  const loadingClient = new QueryClient();
  const loading = renderPage(loadingClient, { slug: 'shipping-policy' });
  assert.match(loading, /در حال بارگذاری محتوا/);
  assert.match(loading, /href="#home"/);

  const offlineClient = new QueryClient();
  const offline = renderPage(offlineClient, { slug: 'shipping-policy', systemState: 'offline' });
  assert.match(offline, /اتصال به اینترنت برقرار نیست/);
  assert.match(offline, /تلاش دوباره/);
  assert.match(offline, /role="alert"/);

  const missingClient = new QueryClient();
  missingClient.setQueryData(queryKeys.content.page('missing-page'), undefined);
  const missing = renderPage(missingClient, { slug: '../admin' });
  assert.match(missing, /این صفحه پیدا نشد/);
  assert.doesNotMatch(missing, /راهنمای ارسال/);

  const publishedClient = new QueryClient();
  publishedClient.setQueryData(queryKeys.content.page(page.slug), page);
  const published = renderPage(publishedClient, { slug: page.slug });
  assert.match(published, /راهنمای ارسال/);
  assert.match(published, /href="\/content\/size%20guide\?from=help"/);
  assert.match(published, /aria-label="محتوای منتشرشده"/);
  assert.doesNotMatch(published, /<strong>/);

  loadingClient.clear();
  offlineClient.clear();
  missingClient.clear();
  publishedClient.clear();
});
