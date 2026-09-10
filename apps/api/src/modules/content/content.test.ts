import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@nova/db';

import { AuditService } from '../audit/audit.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { SeoService } from './seo.service';
import {
  CreateAdminRedirectDto,
  CreateAdminSeoMetadataDto,
  UpdateAdminSeoMetadataDto,
} from './dto/seo.dto';

interface FakeSeoMetadata {
  id: string;
  path: string;
  title: string;
  description: string;
  canonicalUrl: string | null;
  noIndex: boolean;
  structuredData: unknown | null;
  updatedAt: Date;
}

interface FakeRedirect {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  createdAt: Date;
}

function staff(roles: AuthenticatedStaff['roles']): AuthenticatedStaff {
  return {
    id: 'staff-1',
    email: 'admin@nova.test',
    status: 'ACTIVE',
    roles,
  };
}

function createFixture() {
  const metadata: FakeSeoMetadata[] = [
    {
      id: 'seo-1',
      path: '/category/زنانه',
      title: 'زنانه | نوا',
      description: 'پوشاک زنانه نوا.',
      canonicalUrl: '/category/زنانه',
      noIndex: false,
      structuredData: { '@type': 'CollectionPage' },
      updatedAt: new Date('2026-09-09T10:00:00.000Z'),
    },
  ];
  const redirects: FakeRedirect[] = [];
  const audits: Array<Record<string, unknown>> = [];

  const database = {
    seoMetadata: {
      findUnique: async ({ where }: { where: { id?: string; path?: string } }) =>
        metadata.find((item) => (where.id ? item.id === where.id : item.path === where.path)) ??
        null,
      count: async () => metadata.length,
      findMany: async () => [...metadata],
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const created: FakeSeoMetadata = {
          id: 'seo-2',
          path: String(data.path),
          title: String(data.title),
          description: String(data.description),
          canonicalUrl: (data.canonicalUrl as string | null) ?? null,
          noIndex: Boolean(data.noIndex),
          structuredData: data.structuredData === Prisma.JsonNull ? null : data.structuredData,
          updatedAt: new Date('2026-09-09T11:00:00.000Z'),
        };
        metadata.push(created);
        return created;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; updatedAt?: Date };
        data: Record<string, unknown>;
      }) => {
        const current = metadata.find((item) => item.id === where.id);
        if (
          !current ||
          (where.updatedAt && current.updatedAt.getTime() !== where.updatedAt.getTime())
        ) {
          return { count: 0 };
        }
        Object.assign(current, data, { updatedAt: new Date('2026-09-09T12:00:00.000Z') });
        if (current.structuredData === Prisma.JsonNull) current.structuredData = null;
        return { count: 1 };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const index = metadata.findIndex((item) => item.id === where.id);
        if (index >= 0) metadata.splice(index, 1);
        return { id: where.id };
      },
    },
    redirect: {
      findUnique: async ({ where }: { where: { id?: string; fromPath?: string } }) =>
        redirects.find((item) =>
          where.id ? item.id === where.id : item.fromPath === where.fromPath,
        ) ?? null,
      count: async () => redirects.length,
      findMany: async () => [...redirects],
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const created: FakeRedirect = {
          id: `redirect-${redirects.length + 1}`,
          fromPath: String(data.fromPath),
          toPath: String(data.toPath),
          statusCode: Number(data.statusCode),
          createdAt: new Date('2026-09-09T11:00:00.000Z'),
        };
        redirects.push(created);
        return created;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const current = redirects.find((item) => item.id === where.id);
        if (!current) throw new Error('missing redirect');
        Object.assign(current, data);
        return current;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const index = redirects.findIndex((item) => item.id === where.id);
        if (index >= 0) redirects.splice(index, 1);
        return { id: where.id };
      },
    },
    auditEvent: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        audits.push(data);
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
    service: new SeoService({ prisma } as never, audit),
    metadata,
    redirects,
    audits,
  };
}

test('resolves normalized public paths without exposing admin-only metadata fields', async () => {
  const fixture = createFixture();
  const result = await fixture.service.resolve(' /category/زنانه/ ');

  assert.equal(result.path, '/category/زنانه');
  assert.equal(result.metadata?.title, 'زنانه | نوا');
  assert.equal(result.metadata?.canonicalUrl, '/category/زنانه');
  assert.equal(Object.hasOwn(result.metadata ?? {}, 'id'), false);
  assert.equal(result.redirect, null);
});

test('rejects non-public paths and cross-origin canonical URLs before writing', async () => {
  const fixture = createFixture();
  const input = Object.assign(new CreateAdminSeoMetadataDto(), {
    path: 'https://evil.example/steal',
    title: 'ناامن',
    description: 'نباید ذخیره شود.',
  });

  await assert.rejects(
    fixture.service.createMetadata(staff(['admin']), input),
    (error: unknown) => error instanceof BadRequestException,
  );

  const safeInput = Object.assign(new CreateAdminSeoMetadataDto(), {
    path: '/safe',
    title: 'امن',
    description: 'توضیح امن.',
    canonicalUrl: 'https://evil.example/safe',
  });
  await assert.rejects(
    fixture.service.createMetadata(staff(['admin']), safeInput),
    (error: unknown) => error instanceof BadRequestException,
  );
  assert.equal(fixture.metadata.length, 1);
});

test('keeps SEO metadata writes admin-only and audited', async () => {
  const fixture = createFixture();
  const input = Object.assign(new CreateAdminSeoMetadataDto(), {
    path: '/campaign/autumn',
    title: 'پاییز نوا',
    description: 'مجموعه پاییز نوا.',
    noIndex: true,
  });

  await assert.rejects(
    fixture.service.createMetadata(staff(['support']), input),
    (error: unknown) => error instanceof ForbiddenException,
  );

  const created = await fixture.service.createMetadata(staff(['admin']), input);
  assert.equal(created.path, '/campaign/autumn');
  assert.equal(created.noIndex, true);
  assert.equal(fixture.audits.at(-1)?.action, 'content.seo_metadata.created');
});

test('uses optimistic concurrency for metadata updates', async () => {
  const fixture = createFixture();
  const input = Object.assign(new UpdateAdminSeoMetadataDto(), {
    title: 'زنانه جدید | نوا',
    expectedUpdatedAt: '2026-09-09T10:00:00.000Z',
  });

  const updated = await fixture.service.updateMetadata(staff(['admin']), 'seo-1', input);
  assert.equal(updated.title, 'زنانه جدید | نوا');
  assert.equal(fixture.audits.at(-1)?.action, 'content.seo_metadata.updated');

  await assert.rejects(
    fixture.service.updateMetadata(staff(['admin']), 'seo-1', input),
    (error: unknown) => error instanceof ConflictException,
  );
});

test('rejects redirect cycles and keeps redirect destinations site-relative', async () => {
  const fixture = createFixture();
  const first = Object.assign(new CreateAdminRedirectDto(), {
    fromPath: '/old',
    toPath: '/new',
  });
  const second = Object.assign(new CreateAdminRedirectDto(), {
    fromPath: '/new',
    toPath: '/final',
  });

  await fixture.service.createRedirect(staff(['admin']), first);
  await fixture.service.createRedirect(staff(['admin']), second);

  const cycle = Object.assign(new CreateAdminRedirectDto(), {
    fromPath: '/final',
    toPath: '/old',
  });
  await assert.rejects(
    fixture.service.createRedirect(staff(['admin']), cycle),
    (error: unknown) => error instanceof BadRequestException,
  );

  const external = Object.assign(new CreateAdminRedirectDto(), {
    fromPath: '/external',
    toPath: 'https://evil.example',
  });
  await assert.rejects(
    fixture.service.createRedirect(staff(['admin']), external),
    (error: unknown) => error instanceof BadRequestException,
  );
  assert.equal(fixture.redirects.length, 2);
  assert.equal(fixture.audits.at(-1)?.action, 'content.redirect.created');
});
