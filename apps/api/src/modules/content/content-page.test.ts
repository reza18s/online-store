import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ContentPageService } from './content-page.service';

function createService(page: Record<string, unknown> | null) {
  let lastQuery: Record<string, unknown> | undefined;
  const prisma = {
    contentPage: {
      findFirst: async (query: Record<string, unknown>) => {
        lastQuery = query;
        return page;
      },
    },
  };
  return {
    service: new ContentPageService({ prisma } as never),
    getLastQuery: () => lastQuery,
  };
}

test('returns only the published content shape with ordered block data', async () => {
  const fixture = createService({
    id: 'page-1',
    slug: 'shipping-policy',
    title: 'راهنمای ارسال',
    body: 'ارسال سراسری نوا.',
    status: 'PUBLISHED',
    blocks: [
      { kind: 'rich-text', payload: { text: 'اول' }, sortOrder: 0 },
      { kind: 'faq', payload: { question: 'چقدر؟' }, sortOrder: 1 },
    ],
    updatedAt: new Date('2026-09-09T10:00:00.000Z'),
  });

  const result = await fixture.service.getPublishedPage(' Shipping-Policy ');

  assert.deepEqual(result, {
    slug: 'shipping-policy',
    title: 'راهنمای ارسال',
    body: 'ارسال سراسری نوا.',
    blocks: [
      { kind: 'rich-text', payload: { text: 'اول' }, sortOrder: 0 },
      { kind: 'faq', payload: { question: 'چقدر؟' }, sortOrder: 1 },
    ],
  });
  assert.equal(Object.hasOwn(result, 'id'), false);
  assert.equal(
    fixture.getLastQuery()?.where && JSON.stringify(fixture.getLastQuery()?.where),
    JSON.stringify({ slug: 'shipping-policy', status: 'PUBLISHED' }),
  );
});

test('does not expose draft or missing pages as public content', async () => {
  const fixture = createService(null);

  await assert.rejects(
    fixture.service.getPublishedPage('returns-policy'),
    (error: unknown) => error instanceof NotFoundException,
  );
});

test('rejects content slugs outside the normalized Latin URL policy', async () => {
  const fixture = createService(null);

  await assert.rejects(
    fixture.service.getPublishedPage('../admin'),
    (error: unknown) => error instanceof BadRequestException,
  );
  assert.equal(fixture.getLastQuery(), undefined);
});
