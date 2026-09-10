import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  clientSeoForHashRoute,
  createSeoDocument,
  parsePublicRenderPath,
  seoDocumentFromMetadata,
} from './metadata';

test('parses only the clean public rendering paths', () => {
  assert.deepEqual(parsePublicRenderPath('/'), { kind: 'home', path: '/' });
  assert.deepEqual(parsePublicRenderPath('/category/women/'), {
    kind: 'category',
    path: '/category/women',
    slug: 'women',
  });
  assert.deepEqual(parsePublicRenderPath('/product/linen-overshirt'), {
    kind: 'product',
    path: '/product/linen-overshirt',
    slug: 'linen-overshirt',
  });
  assert.deepEqual(parsePublicRenderPath('/account/orders'), {
    kind: 'private',
    path: '/account/orders',
  });
  assert.equal(parsePublicRenderPath('/category/not-a-public-audience').kind, 'unknown');
  assert.equal(parsePublicRenderPath('/product/bad%2Fslug').kind, 'unknown');
});

test('metadata has one canonical source and suppresses structured data for noindex pages', () => {
  const seo = createSeoDocument({
    origin: 'https://nova.example',
    title: 'Product',
    description: 'Description',
    canonicalPath: '/product/linen-overshirt',
    jsonLd: { '@type': 'Product' },
  });
  assert.equal(seo.canonicalUrl, 'https://nova.example/product/linen-overshirt');
  assert.equal(seo.robots, 'index, follow');
  assert.deepEqual(seo.jsonLd, { '@type': 'Product' });

  const privateSeo = createSeoDocument({
    origin: 'https://nova.example',
    title: 'Account',
    description: 'Private',
    noIndex: true,
    canonicalPath: '/account',
    jsonLd: { '@type': 'WebPage' },
  });
  assert.equal(privateSeo.robots, 'noindex, nofollow');
  assert.equal(privateSeo.jsonLd, null);
});

test('resolver metadata overrides fallbacks without changing the route contract', () => {
  const seo = seoDocumentFromMetadata(
    'https://nova.example',
    {
      title: 'Fallback',
      description: 'Fallback description',
      canonicalPath: '/product/linen-overshirt',
      jsonLd: { fallback: true },
    },
    {
      path: '/product/linen-overshirt',
      title: 'Managed title',
      description: 'Managed description',
      canonicalUrl: '/product/linen-overshirt',
      noIndex: false,
      structuredData: { managed: true },
    },
  );
  assert.equal(seo.title, 'Managed title');
  assert.equal(seo.description, 'Managed description');
  assert.deepEqual(seo.jsonLd, { managed: true });
});

test('client hash routes keep the existing copy while private routes become noindex', () => {
  const category = clientSeoForHashRoute('#category/women', 'https://nova.example');
  assert.equal(category.title, 'NOVA | زنانه');
  assert.equal(category.canonicalUrl, 'https://nova.example/category/women');

  const account = clientSeoForHashRoute('#account/orders', 'https://nova.example');
  assert.equal(account.robots, 'noindex, nofollow');
  assert.equal(account.canonicalUrl, null);
});
