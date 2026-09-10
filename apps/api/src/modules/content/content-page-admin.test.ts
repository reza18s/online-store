import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@nova/db';

import { AuditService } from '../audit/audit.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { ContentPageAdminService } from './content-page-admin.service';
import {
  CreateAdminContentPageDto,
  UpdateAdminContentPageDto,
  UpdateAdminContentPageStatusDto,
} from './dto/admin-content-page.dto';
import { AdminContentPageListQueryDto } from './dto/admin-content-page.query';

type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface FakeBlock {
  id: string;
  contentPageId: string;
  kind: string;
  payload: unknown;
  sortOrder: number;
}

interface FakePage {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
  blocks: FakeBlock[];
}

interface FixtureState {
  pages: FakePage[];
  audits: Array<Record<string, unknown>>;
  deletedBlockPageIds: string[];
}

interface FakeCreatePageData extends Record<string, unknown> {
  blocks?: { create?: Array<Record<string, unknown>> };
}

function createStaff(roles: AuthenticatedStaff['roles']): AuthenticatedStaff {
  return {
    id: 'staff-1',
    email: 'admin@nova.test',
    status: 'ACTIVE',
    roles,
  };
}

function clonePage(page: FakePage): FakePage {
  return {
    ...page,
    createdAt: new Date(page.createdAt),
    updatedAt: new Date(page.updatedAt),
    blocks: page.blocks.map((block) => ({ ...block })),
  };
}

function asJsonValue(value: unknown): unknown {
  return value === Prisma.JsonNull ? null : value;
}

function createFixture(initial?: Partial<FakePage>) {
  const now = new Date('2026-09-09T10:00:00.000Z');
  const state: FixtureState = {
    pages: [
      {
        id: 'page-1',
        slug: 'shipping-policy',
        title: 'راهنمای ارسال',
        body: 'ارسال سراسری نوا.',
        status: 'DRAFT',
        createdAt: new Date('2026-09-08T10:00:00.000Z'),
        updatedAt: now,
        blocks: [
          {
            id: 'block-1',
            contentPageId: 'page-1',
            kind: 'rich-text',
            payload: { text: 'قدیمی' },
            sortOrder: 0,
          },
        ],
        ...initial,
      },
    ],
    audits: [],
    deletedBlockPageIds: [],
  };

  const database = {
    contentPage: {
      count: async ({ where }: { where?: { status?: ContentStatus; OR?: unknown[] } }) =>
        state.pages.filter((page) => {
          if (where?.status && page.status !== where.status) return false;
          if (!where?.OR) return true;
          return where.OR.some((condition) => {
            const [field, filter] = Object.entries(condition as Record<string, unknown>)[0] ?? [];
            const value = String(page[field as keyof FakePage] ?? '').toLowerCase();
            const needle = String((filter as { contains?: unknown })?.contains ?? '').toLowerCase();
            return value.includes(needle);
          });
        }).length,
      findMany: async ({ where }: { where?: { status?: ContentStatus; OR?: unknown[] } }) =>
        state.pages
          .filter((page) => {
            if (where?.status && page.status !== where.status) return false;
            if (!where?.OR) return true;
            return where.OR.some((condition) => {
              const [field, filter] = Object.entries(condition as Record<string, unknown>)[0] ?? [];
              const value = String(page[field as keyof FakePage] ?? '').toLowerCase();
              const needle = String(
                (filter as { contains?: unknown })?.contains ?? '',
              ).toLowerCase();
              return value.includes(needle);
            });
          })
          .map(clonePage),
      findUnique: async ({ where }: { where: { id?: string } }) => {
        const page = state.pages.find((candidate) => candidate.id === where.id);
        return page ? clonePage(page) : null;
      },
      create: async ({ data }: { data: FakeCreatePageData }) => {
        const page: FakePage = {
          id: 'page-created',
          slug: String(data.slug),
          title: String(data.title),
          body: (data.body as string | null) ?? null,
          status: data.status as ContentStatus,
          createdAt: new Date('2026-09-09T11:00:00.000Z'),
          updatedAt: new Date('2026-09-09T11:00:00.000Z'),
          blocks: (data.blocks?.create ?? []).map(
            (block: Record<string, unknown>, index: number) => ({
              id: `block-created-${index + 1}`,
              contentPageId: 'page-created',
              kind: String(block.kind),
              payload: asJsonValue(block.payload),
              sortOrder: Number(block.sortOrder),
            }),
          ),
        };
        state.pages.push(page);
        return clonePage(page);
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; updatedAt?: Date };
        data: Record<string, unknown>;
      }) => {
        const page = state.pages.find((candidate) => candidate.id === where.id);
        if (!page || (where.updatedAt && page.updatedAt.getTime() !== where.updatedAt.getTime())) {
          return { count: 0 };
        }
        if (data.title !== undefined) page.title = String(data.title);
        if (data.body !== undefined) page.body = data.body as string | null;
        if (data.status !== undefined) page.status = data.status as ContentStatus;
        page.updatedAt = new Date('2026-09-09T12:00:00.000Z');
        return { count: 1 };
      },
    },
    contentBlock: {
      deleteMany: async ({ where }: { where: { contentPageId: string } }) => {
        state.deletedBlockPageIds.push(where.contentPageId);
        const page = state.pages.find((candidate) => candidate.id === where.contentPageId);
        const count = page?.blocks.length ?? 0;
        if (page) page.blocks = [];
        return { count };
      },
      createMany: async ({ data }: { data: Array<Record<string, unknown>> }) => {
        const pageId = String(data[0]?.contentPageId ?? '');
        const page = state.pages.find((candidate) => candidate.id === pageId);
        if (page) {
          page.blocks.push(
            ...data.map((block, index) => ({
              id: `block-replaced-${index + 1}`,
              contentPageId: pageId,
              kind: String(block.kind),
              payload: asJsonValue(block.payload),
              sortOrder: Number(block.sortOrder),
            })),
          );
        }
        return { count: data.length };
      },
    },
    auditEvent: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        state.audits.push(data);
        return data;
      },
    },
  };
  const prisma = {
    ...database,
    $transaction: async <T>(callback: (transaction: typeof database) => Promise<T>): Promise<T> =>
      callback(database),
  };
  const audit = new AuditService({ prisma } as never);

  return {
    state,
    service: new ContentPageAdminService({ prisma } as never, audit),
  };
}

test('admin content pages are created as drafts, normalized, and audited', async () => {
  const fixture = createFixture();
  const input = Object.assign(new CreateAdminContentPageDto(), {
    slug: '  Returns-Policy  ',
    title: '  شرایط بازگشت  ',
    body: '  متن راهنمای بازگشت  ',
    blocks: [
      {
        kind: ' Hero-Banner ',
        payload: { heading: 'بازگشت آسان' },
        sortOrder: 2,
      },
    ],
  });

  const created = await fixture.service.create(createStaff(['admin']), input);

  assert.equal(created.slug, 'returns-policy');
  assert.equal(created.title, 'شرایط بازگشت');
  assert.equal(created.body, 'متن راهنمای بازگشت');
  assert.equal(created.status, 'DRAFT');
  assert.deepEqual(created.blocks, [
    {
      id: 'block-created-1',
      kind: 'hero-banner',
      payload: { heading: 'بازگشت آسان' },
      sortOrder: 2,
    },
  ]);
  assert.equal(fixture.state.audits.at(-1)?.action, 'content.page.created');
  assert.deepEqual(fixture.state.audits.at(-1)?.metadata, {
    slug: 'returns-policy',
    status: 'DRAFT',
    blockCount: 1,
  });
});

test('content page updates replace blocks and reject stale editors', async () => {
  const fixture = createFixture();
  const input = Object.assign(new UpdateAdminContentPageDto(), {
    title: 'راهنمای ارسال جدید',
    blocks: [{ kind: 'faq', payload: { question: 'چقدر زمان می‌برد؟' } }],
    expectedUpdatedAt: '2026-09-09T10:00:00.000Z',
  });

  const updated = await fixture.service.update(createStaff(['admin']), 'page-1', input);

  assert.equal(updated.title, 'راهنمای ارسال جدید');
  assert.deepEqual(updated.blocks, [
    {
      id: 'block-replaced-1',
      kind: 'faq',
      payload: { question: 'چقدر زمان می‌برد؟' },
      sortOrder: 0,
    },
  ]);
  assert.deepEqual(fixture.state.deletedBlockPageIds, ['page-1']);
  assert.equal(fixture.state.audits.at(-1)?.action, 'content.page.updated');

  await assert.rejects(
    fixture.service.update(createStaff(['admin']), 'page-1', input),
    (error: unknown) => error instanceof ConflictException,
  );
});

test('publishing requires content, honors allowed transitions, and records the status change', async () => {
  const fixture = createFixture({ body: null, blocks: [] });
  const publish = Object.assign(new UpdateAdminContentPageStatusDto(), {
    status: 'PUBLISHED',
  });

  await assert.rejects(
    fixture.service.updateStatus(createStaff(['admin']), 'page-1', publish),
    (error: unknown) => error instanceof BadRequestException,
  );
  assert.equal(fixture.state.pages[0]?.status, 'DRAFT');
  assert.equal(fixture.state.audits.length, 0);

  fixture.state.pages[0]!.body = 'محتوای قابل انتشار';
  const published = await fixture.service.updateStatus(
    createStaff(['admin']),
    'page-1',
    Object.assign(new UpdateAdminContentPageStatusDto(), {
      status: 'PUBLISHED',
      expectedUpdatedAt: '2026-09-09T10:00:00.000Z',
    }),
  );

  assert.equal(published.status, 'PUBLISHED');
  assert.equal(fixture.state.audits.at(-1)?.action, 'content.page.status_changed');
  assert.deepEqual(fixture.state.audits.at(-1)?.metadata, {
    slug: 'shipping-policy',
    fromStatus: 'DRAFT',
    toStatus: 'PUBLISHED',
  });
});

test('content page reads and mutations remain admin-only', async () => {
  const fixture = createFixture();
  const query = Object.assign(new AdminContentPageListQueryDto(), { q: 'shipping' });
  const page = await fixture.service.list(createStaff(['admin']), query);

  assert.equal(page.total, 1);
  assert.equal(page.items[0]?.slug, 'shipping-policy');
  assert.equal(page.items[0]?.createdAt instanceof Date, true);

  await assert.rejects(
    fixture.service.get(createStaff(['support']), 'page-1'),
    (error: unknown) => error instanceof ForbiddenException,
  );
  await assert.rejects(
    fixture.service.create(createStaff(['support']), new CreateAdminContentPageDto()),
    (error: unknown) => error instanceof ForbiddenException,
  );
});
