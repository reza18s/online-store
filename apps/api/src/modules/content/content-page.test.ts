import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ContentController } from './content.controller';
import { ContentPageService } from './content-page.service';

function createService(
  page: Record<string, unknown> | null,
  pages: Array<Record<string, unknown>> = [],
) {
  let lastQuery: Record<string, unknown> | undefined;
  let lastListQuery: Record<string, unknown> | undefined;
  const prisma = {
    contentPage: {
      findFirst: async (query: Record<string, unknown>) => {
        lastQuery = query;
        return page;
      },
      findMany: async (query: Record<string, unknown>) => {
        lastListQuery = query;
        const status = (query.where as Record<string, unknown> | undefined)?.status;
        return pages
          .filter((candidate) => candidate.status === status)
          .sort((left, right) => String(left.slug).localeCompare(String(right.slug)));
      },
    },
  };
  return {
    service: new ContentPageService({ prisma } as never),
    getLastQuery: () => lastQuery,
    getLastListQuery: () => lastListQuery,
  };
}

test('lists the complete published content summaries in deterministic order', async () => {
  const fixture = createService(null, [
    {
      id: 'page-1',
      slug: 'returns-policy',
      title: 'راهنمای مرجوعی',
      updatedAt: new Date('2026-09-10T10:00:00.000Z'),
      body: 'نباید برگردد.',
      status: 'PUBLISHED',
    },
    {
      id: 'page-2',
      slug: 'shipping-policy',
      title: 'راهنمای ارسال',
      updatedAt: new Date('2026-09-09T10:00:00.000Z'),
      body: 'نباید برگردد.',
      status: 'DRAFT',
    },
    {
      id: 'page-3',
      slug: 'terms',
      title: 'شرایط استفاده',
      updatedAt: new Date('2026-09-08T10:00:00.000Z'),
      body: 'نباید برگردد.',
      status: 'PUBLISHED',
    },
  ]);

  const result = await fixture.service.listPublishedPages();

  assert.deepEqual(result, [
    {
      slug: 'returns-policy',
      title: 'راهنمای مرجوعی',
      updatedAt: '2026-09-10T10:00:00.000Z',
    },
    {
      slug: 'terms',
      title: 'شرایط استفاده',
      updatedAt: '2026-09-08T10:00:00.000Z',
    },
  ]);
  assert.deepEqual(fixture.getLastListQuery(), {
    where: { status: 'PUBLISHED' },
    orderBy: [{ slug: 'asc' }],
    select: { slug: true, title: true, updatedAt: true },
  });
  assert.equal('take' in fixture.getLastListQuery()!, false);
  assert.equal(Object.hasOwn(result[0]!, 'body'), false);
  assert.equal(Object.hasOwn(result[0]!, 'status'), false);
  assert.equal(Object.hasOwn(result[0]!, 'id'), false);
});

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

test('returns the published page index in the standard public envelope', async () => {
  const controller = new ContentController({
    listPublishedPages: async () => [
      {
        slug: 'shipping-policy',
        title: 'راهنمای ارسال',
        updatedAt: '2026-09-09T10:00:00.000Z',
      },
    ],
  } as never);

  const response = await controller.index({ requestId: 'request-1' } as never);

  assert.deepEqual(response.data, [
    {
      slug: 'shipping-policy',
      title: 'راهنمای ارسال',
      updatedAt: '2026-09-09T10:00:00.000Z',
    },
  ]);
  assert.deepEqual(Object.keys(response).sort(), ['data', 'meta']);
  assert.deepEqual(response.meta, {
    requestId: 'request-1',
    timestamp: response.meta.timestamp,
  });
  assert.match(response.meta.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.deepEqual(Object.keys(response.data[0]!).sort(), ['slug', 'title', 'updatedAt']);
});
