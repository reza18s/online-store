import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  canManageAdminContent,
  getAdminContentSeoState,
  getPublishReadiness,
  isAdminContentSeoEditorInputDisabled,
  isContentPublishActionDisabled,
  isSafeSiteRelativePath,
  normalizeAdminContentSeoView,
  normalizeSiteRelativePath,
  parseBoundedJson,
  safeContentHref,
  validateContentBlocks,
  validateContentDraft,
  validateRedirectDraft,
  validateSeoDraft,
  wouldCreateRedirectCycle,
} from './admin-content-seo-page';

test('normalizes view and site-relative paths without changing public slug links', () => {
  assert.equal(normalizeAdminContentSeoView('seo'), 'seo');
  assert.equal(normalizeAdminContentSeoView('unknown'), 'content');
  assert.equal(normalizeSiteRelativePath(' /shipping/// '), '/shipping');
  assert.equal(isSafeSiteRelativePath('/category/زنانه'), true);
  assert.equal(isSafeSiteRelativePath('https://evil.example'), false);
  assert.equal(safeContentHref(' Shipping-Policy '), '#content/shipping-policy');
});

test('allows only the admin role to mutate content operations', () => {
  assert.equal(canManageAdminContent(['ADMIN']), true);
  assert.equal(canManageAdminContent(['operations']), false);
  assert.equal(canManageAdminContent(undefined), false);
});

test('bounds typed JSON and rejects HTML-like payloads', () => {
  assert.deepEqual(parseBoundedJson('{"kind":"hero"}').value, { kind: 'hero' });
  assert.match(parseBoundedJson('<p>unsafe</p>').error ?? '', /معتبر نیست/);
  assert.match(parseBoundedJson('{"html":"<script>alert(1)</script>"}').error ?? '', /HTML/);
  assert.equal(
    validateContentBlocks(JSON.stringify([{ kind: 'hero', payload: { title: 'سلام' } }])).blocks
      ?.length,
    1,
  );
  assert.match(validateContentBlocks('[{"kind":"Hero","payload":{}}]').error ?? '', /نوع بلوک/);
  assert.match(
    validateContentBlocks(
      JSON.stringify(Array.from({ length: 13 }, (_, index) => ({ kind: 'text', payload: index }))),
    ).error ?? '',
    /12/,
  );
});

test('keeps drafts publishable only after required content and valid slug policy', () => {
  const empty: Parameters<typeof validateContentDraft>[0] = {
    slug: 'shipping-policy',
    title: 'ارسال',
    body: '',
    blocksJson: '[]',
  };
  assert.equal(getPublishReadiness(empty).canPublish, false);
  assert.equal(getPublishReadiness({ ...empty, body: 'راهنمای ارسال' }).canPublish, true);
  assert.match(validateContentDraft({ ...empty, slug: 'Shipping Policy' }).error ?? '', /اسلاگ/);
  assert.equal(validateContentDraft(empty).input?.body, null);
});

test('validates SEO metadata and site-relative redirects', () => {
  const seo: Parameters<typeof validateSeoDraft>[0] = {
    path: '/shipping',
    title: 'ارسال',
    description: 'راهنمای ارسال',
    canonicalUrl: 'https://example.com/shipping',
    noIndex: false,
    structuredDataJson: '{"@type":"WebPage"}',
  };
  assert.equal(validateSeoDraft(seo).input?.path, '/shipping');
  assert.match(validateSeoDraft({ ...seo, path: 'javascript:alert(1)' }).error ?? '', /مسیر/);
  const redirect: Parameters<typeof validateRedirectDraft>[0] = {
    fromPath: '/old',
    toPath: '/new',
    statusCode: 301,
  };
  assert.equal(validateRedirectDraft(redirect).input?.toPath, '/new');
  assert.match(
    validateRedirectDraft({ ...redirect, toPath: 'https://evil.example' }).error ?? '',
    /داخلی/,
  );
});

test('detects direct and chained redirect cycles before submission', () => {
  const redirects = [
    { id: 'a', fromPath: '/old', toPath: '/new' },
    { id: 'b', fromPath: '/new', toPath: '/final' },
  ];
  assert.equal(wouldCreateRedirectCycle(redirects, { fromPath: '/final', toPath: '/old' }), true);
  assert.equal(
    wouldCreateRedirectCycle(redirects, { id: 'a', fromPath: '/old', toPath: '/final' }),
    false,
  );
  assert.equal(wouldCreateRedirectCycle(redirects, { fromPath: '/same', toPath: '/same' }), true);
});

test('chooses permission, loading, offline, error, empty and ready states deterministically', () => {
  assert.equal(getAdminContentSeoState({ isPending: true }, ['admin']), 'loading');
  assert.equal(getAdminContentSeoState({ hasItems: false }, ['operations']), 'permission');
  assert.equal(
    getAdminContentSeoState({ isError: true, error: new TypeError('network failed') }, ['admin']),
    'offline',
  );
  assert.equal(
    getAdminContentSeoState({ isError: true, error: new Error('bad') }, ['admin']),
    'error',
  );
  assert.equal(getAdminContentSeoState({ hasItems: false }, ['admin']), 'empty');
  assert.equal(getAdminContentSeoState({ hasItems: true }, ['admin']), 'ready');
});

test('locks every editor input while a content mutation is pending', () => {
  assert.equal(isAdminContentSeoEditorInputDisabled(true, true), true);
  assert.equal(isAdminContentSeoEditorInputDisabled(true, false), false);
  assert.equal(isAdminContentSeoEditorInputDisabled(false, false), true);
});

test('does not publish a content draft while its editor has unsaved changes', () => {
  assert.equal(isContentPublishActionDisabled(true, false, true), true);
  assert.equal(isContentPublishActionDisabled(true, false, false), false);
  assert.equal(isContentPublishActionDisabled(true, true, false), true);
  assert.equal(isContentPublishActionDisabled(false, false, false), true);
});
