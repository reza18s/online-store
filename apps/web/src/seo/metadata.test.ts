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
  assert.deepEqual(parsePublicRenderPath('/products/new'), {
    kind: 'client',
    path: '/products/new',
  });
  assert.deepEqual(parsePublicRenderPath('/support'), {
    kind: 'client',
    path: '/support',
  });
  assert.equal(parsePublicRenderPath('/category/not-a-public-audience').kind, 'unknown');
  assert.equal(parsePublicRenderPath('/product/bad%2Fslug').kind, 'unknown');
  assert.equal(parsePublicRenderPath(`/content/${'a'.repeat(121)}`).kind, 'unknown');
  assert.equal(parsePublicRenderPath('//').kind, 'unknown');
  assert.equal(parsePublicRenderPath('///').kind, 'unknown');
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

test('falls back from unsafe resolver canonicals to the recognized route canonical', () => {
  const fallback = {
    title: 'Fallback',
    description: 'Fallback description',
    canonicalPath: '/product/linen-overshirt',
  };
  const unsafeCanonicals = [
    'https://evil.example/product/else',
    'https://nova.example/product/else?utm_source=unsafe',
    'https://nova.example/product/else#fragment',
    'https://user:pass@nova.example/product/else',
    '/product/else\\variant',
    '/account/orders',
  ];

  for (const canonicalUrl of unsafeCanonicals) {
    const seo = seoDocumentFromMetadata('https://nova.example', fallback, {
      path: '/product/linen-overshirt',
      title: 'Managed title',
      description: 'Managed description',
      canonicalUrl,
      noIndex: false,
      structuredData: null,
    });
    assert.equal(seo.canonicalUrl, 'https://nova.example/product/linen-overshirt', canonicalUrl);
  }
});

test('client public content stays indexable while catalog compatibility routes are noindex', () => {
  const category = clientSeoForHashRoute('#category/women', 'https://nova.example');
  assert.equal(category.title, 'NOVA | زنانه');
  assert.equal(category.canonicalUrl, 'https://nova.example/category/women');

  const product = clientSeoForHashRoute('#product/linen-overshirt', 'https://nova.example');
  assert.equal(product.robots, 'index, follow');
  assert.equal(product.canonicalUrl, 'https://nova.example/product/linen-overshirt');

  const invalidProduct = clientSeoForHashRoute('#product/bad%2Fslug', 'https://nova.example');
  assert.equal(invalidProduct.robots, 'noindex, nofollow');
  assert.equal(invalidProduct.canonicalUrl, null);

  for (const route of [
    '#products',
    '#products/women?sort=newest&color=red',
    '#search?sort=newest',
  ]) {
    assert.equal(clientSeoForHashRoute(route, 'https://nova.example').robots, 'noindex, nofollow');
  }

  const content = clientSeoForHashRoute('#content/size-guide', 'https://nova.example');
  assert.equal(content.robots, 'index, follow');
  assert.equal(content.canonicalUrl, 'https://nova.example/content/size-guide');

  const invalidContent = clientSeoForHashRoute('#content/bad%2Fslug', 'https://nova.example');
  assert.equal(invalidContent.robots, 'noindex, nofollow');
  assert.equal(invalidContent.canonicalUrl, null);

  const editorial = clientSeoForHashRoute('#campaign', 'https://nova.example');
  assert.equal(editorial.robots, 'index, follow');

  const unknown = clientSeoForHashRoute('#unrecognized', 'https://nova.example');
  assert.equal(unknown.robots, 'noindex, nofollow');
  assert.equal(unknown.canonicalUrl, null);

  const invalidCategory = clientSeoForHashRoute('#category/unknown', 'https://nova.example');
  assert.equal(invalidCategory.robots, 'noindex, nofollow');
  assert.equal(invalidCategory.canonicalUrl, null);

  const account = clientSeoForHashRoute('#account/orders', 'https://nova.example');
  assert.equal(account.robots, 'noindex, nofollow');
  assert.equal(account.canonicalUrl, null);

  const temporaryState = clientSeoForHashRoute('#state/offline', 'https://nova.example');
  assert.equal(temporaryState.robots, 'noindex, nofollow');

  const notFound = clientSeoForHashRoute('#not-found', 'https://nova.example');
  assert.equal(notFound.robots, 'noindex, nofollow');
});
