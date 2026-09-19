import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  adminRedirectsRequestPath,
  adminContentPagesRequestPath,
  adminSeoMetadataRequestPath,
  contentPagePath,
  contentPageRequestPath,
  seoResolvePath,
  seoResolveRequestPath,
} from './content-api';

test('uses the versioned public SEO resolver and preserves RTL paths', () => {
  assert.equal(seoResolvePath, '/v1/seo/resolve');
  assert.equal(
    seoResolveRequestPath('/category/زنانه/'),
    '/v1/seo/resolve?path=%2Fcategory%2F%D8%B2%D9%86%D8%A7%D9%86%D9%87',
  );
});

test('keeps published content pages on a versioned, encoded transport path', () => {
  assert.equal(contentPagePath, '/v1/content/pages');
  assert.equal(contentPageRequestPath(' Shipping-Policy '), '/v1/content/pages/shipping-policy');
});

test('keeps admin content listing transport bounded and queryable', () => {
  assert.equal(
    adminContentPagesRequestPath({ q: 'ارسال', status: 'PUBLISHED', page: 2, limit: 12 }),
    '/v1/admin/content/pages?q=%D8%A7%D8%B1%D8%B3%D8%A7%D9%84&status=PUBLISHED&page=2&limit=12',
  );
  assert.equal(
    adminSeoMetadataRequestPath({ q: 'مانتو', page: 2, limit: 12 }),
    '/v1/admin/content/seo-metadata?q=%D9%85%D8%A7%D9%86%D8%AA%D9%88&page=2&limit=12',
  );
  assert.equal(
    adminRedirectsRequestPath({ q: '/old', page: 1, limit: 24 }),
    '/v1/admin/content/redirects?q=%2Fold&page=1&limit=24',
  );
});
