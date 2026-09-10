import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { environment } from '@nova/config';
import { Prisma } from '@nova/db';
import type { DatabaseClient } from '@nova/db';
import type {
  SeoMetadata,
  SeoRedirect,
  SeoRedirectStatusCode,
  SeoResolution,
} from '@nova/api-client';

import { DatabaseService } from '../../database/database.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { assertStaffRole } from '../staff-auth/staff-auth.guard';
import { normalizeContentJson } from './content-json';
import {
  CreateAdminRedirectDto,
  CreateAdminSeoMetadataDto,
  SEO_REDIRECT_STATUS_CODES,
  UpdateAdminRedirectDto,
  UpdateAdminSeoMetadataDto,
} from './dto/seo.dto';
import { AdminContentListQueryDto, SEO_PUBLIC_PATH_MAX_LENGTH } from './dto/seo.query';

const seoMetadataSelect = {
  id: true,
  path: true,
  title: true,
  description: true,
  canonicalUrl: true,
  noIndex: true,
  structuredData: true,
  updatedAt: true,
} as const satisfies Prisma.SeoMetadataSelect;

const redirectSelect = {
  id: true,
  fromPath: true,
  toPath: true,
  statusCode: true,
  createdAt: true,
} as const satisfies Prisma.RedirectSelect;

type SeoMetadataSource = Prisma.SeoMetadataGetPayload<{ select: typeof seoMetadataSelect }>;
type RedirectSource = Prisma.RedirectGetPayload<{ select: typeof redirectSelect }>;
type ContentDatabase = DatabaseClient | Prisma.TransactionClient;

const REDIRECT_CHAIN_LIMIT = 8;

export interface SeoMetadataView {
  id: string;
  path: string;
  title: string;
  description: string;
  canonicalUrl: string | null;
  noIndex: boolean;
  structuredData: Prisma.JsonValue | null;
  updatedAt: Date;
}

export interface RedirectView {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: SeoRedirectStatusCode;
  createdAt: Date;
}

export interface SeoMetadataPageView {
  items: SeoMetadataView[];
  total: number;
  page: number;
  limit: number;
}

export interface RedirectPageView {
  items: RedirectView[];
  total: number;
  page: number;
  limit: number;
}

function isValidRedirectStatusCode(value: number): value is SeoRedirectStatusCode {
  return (SEO_REDIRECT_STATUS_CODES as readonly number[]).includes(value);
}

function containsControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });
}

function redirectStatusCode(value: number): SeoRedirectStatusCode {
  if (!isValidRedirectStatusCode(value)) {
    throw new Error('The persisted redirect status code is not supported.');
  }
  return value;
}

export function normalizePublicPath(value: string, field = 'مسیر عمومی'): string {
  if (typeof value !== 'string') throw new BadRequestException(`${field} معتبر نیست.`);

  const path = value.trim();
  if (
    path.length === 0 ||
    path.length > SEO_PUBLIC_PATH_MAX_LENGTH ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    path.includes('?') ||
    path.includes('#') ||
    path.includes('//') ||
    containsControlCharacter(path)
  ) {
    throw new BadRequestException(`${field} باید یک مسیر نسبی عمومی بدون query یا fragment باشد.`);
  }

  if (path === '/') return path;
  return path.replace(/\/+$/, '') || '/';
}

function normalizeRequiredText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new BadRequestException(`${field} نمی‌تواند خالی باشد.`);
  return normalized;
}

function normalizeCanonicalUrl(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value.trim() === '') return null;

  const canonical = value.trim();
  if (canonical.startsWith('/')) return normalizePublicPath(canonical, 'canonical URL');

  let parsed: URL;
  try {
    parsed = new URL(canonical);
  } catch {
    throw new BadRequestException('canonical URL معتبر نیست.');
  }

  const configuredOrigin = new URL(environment.WEB_ORIGIN).origin;
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.origin !== configuredOrigin ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new BadRequestException('canonical URL باید به دامنه عمومی پیکربندی‌شده اشاره کند.');
  }

  return parsed.toString();
}

function recordId(value: string, field: string): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(value)) {
    throw new BadRequestException(`${field} معتبر نیست.`);
  }
  return value;
}

function listBounds(query: AdminContentListQueryDto): { page: number; limit: number } {
  const page = query.page ?? 1;
  const limit = query.limit ?? 24;
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000) {
    throw new BadRequestException('شماره صفحه محتوا معتبر نیست.');
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException('اندازه صفحه محتوا معتبر نیست.');
  }
  return { page, limit };
}

function expectedDate(value: string | undefined): Date | undefined {
  if (value === undefined) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('زمان ویرایش metadata معتبر نیست.');
  }
  return date;
}

function toSeoMetadataView(source: SeoMetadataSource): SeoMetadataView {
  return {
    id: source.id,
    path: source.path,
    title: source.title,
    description: source.description,
    canonicalUrl: source.canonicalUrl,
    noIndex: source.noIndex,
    structuredData: source.structuredData,
    updatedAt: source.updatedAt,
  };
}

function toPublicSeoMetadata(source: SeoMetadataSource): SeoMetadata {
  return {
    path: source.path,
    title: source.title,
    description: source.description,
    canonicalUrl: source.canonicalUrl,
    noIndex: source.noIndex,
    structuredData: source.structuredData,
  };
}

function toRedirectView(source: RedirectSource): RedirectView {
  return {
    id: source.id,
    fromPath: source.fromPath,
    toPath: source.toPath,
    statusCode: redirectStatusCode(source.statusCode),
    createdAt: source.createdAt,
  };
}

function toPublicRedirect(source: RedirectSource): SeoRedirect {
  return {
    fromPath: source.fromPath,
    toPath: source.toPath,
    statusCode: redirectStatusCode(source.statusCode),
  };
}

@Injectable()
export class SeoService {
  public constructor(
    private readonly database: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  public async resolve(pathInput: string): Promise<SeoResolution> {
    const path = normalizePublicPath(pathInput);
    const [metadata, redirect] = await Promise.all([
      this.database.prisma.seoMetadata.findUnique({ where: { path }, select: seoMetadataSelect }),
      this.database.prisma.redirect.findUnique({
        where: { fromPath: path },
        select: redirectSelect,
      }),
    ]);

    return {
      path,
      metadata: metadata ? toPublicSeoMetadata(metadata) : null,
      redirect: redirect ? toPublicRedirect(redirect) : null,
    };
  }

  public async listMetadata(
    staff: AuthenticatedStaff,
    query: AdminContentListQueryDto,
  ): Promise<SeoMetadataPageView> {
    assertStaffRole(staff, 'admin');
    const { page, limit } = listBounds(query);
    const q = query.q?.trim();
    const where: Prisma.SeoMetadataWhereInput = q
      ? {
          OR: [
            { path: { contains: q, mode: 'insensitive' } },
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};
    const [total, items] = await Promise.all([
      this.database.prisma.seoMetadata.count({ where }),
      this.database.prisma.seoMetadata.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: seoMetadataSelect,
      }),
    ]);
    return { items: items.map(toSeoMetadataView), total, page, limit };
  }

  public async createMetadata(
    staff: AuthenticatedStaff,
    input: CreateAdminSeoMetadataDto,
  ): Promise<SeoMetadataView> {
    assertStaffRole(staff, 'admin');
    const normalized = {
      path: normalizePublicPath(input.path),
      title: normalizeRequiredText(input.title, 'عنوان metadata'),
      description: normalizeRequiredText(input.description, 'توضیحات metadata'),
      canonicalUrl: normalizeCanonicalUrl(input.canonicalUrl),
      noIndex: input.noIndex ?? false,
      structuredData: normalizeContentJson(input.structuredData, 'structured data'),
    };

    try {
      const created = await this.database.prisma.$transaction(async (transaction) => {
        const metadata = await transaction.seoMetadata.create({
          data: normalized,
          select: seoMetadataSelect,
        });
        await this.audit.record(
          {
            actorType: 'STAFF',
            actorUserId: staff.id,
            action: 'content.seo_metadata.created',
            resourceType: 'SeoMetadata',
            resourceId: metadata.id,
            metadata: { path: metadata.path },
          },
          transaction,
        );
        return metadata;
      });
      return toSeoMetadataView(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('این مسیر قبلاً metadata دارد.');
      }
      throw error;
    }
  }

  public async updateMetadata(
    staff: AuthenticatedStaff,
    metadataIdInput: string,
    input: UpdateAdminSeoMetadataDto,
  ): Promise<SeoMetadataView> {
    assertStaffRole(staff, 'admin');
    const metadataId = recordId(metadataIdInput, 'شناسه metadata');
    const current = await this.database.prisma.seoMetadata.findUnique({
      where: { id: metadataId },
      select: seoMetadataSelect,
    });
    if (!current) throw new NotFoundException('metadata پیدا نشد.');

    const data: Prisma.SeoMetadataUpdateManyMutationInput = {
      ...(input.title === undefined
        ? {}
        : { title: normalizeRequiredText(input.title, 'عنوان metadata') }),
      ...(input.description === undefined
        ? {}
        : { description: normalizeRequiredText(input.description, 'توضیحات metadata') }),
      ...(input.canonicalUrl === undefined
        ? {}
        : { canonicalUrl: normalizeCanonicalUrl(input.canonicalUrl) }),
      ...(input.noIndex === undefined ? {} : { noIndex: input.noIndex }),
      ...(input.structuredData === undefined
        ? {}
        : { structuredData: normalizeContentJson(input.structuredData, 'structured data') }),
    };
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('حداقل یک تغییر برای metadata لازم است.');
    }

    const updatedAt = expectedDate(input.expectedUpdatedAt);
    const updated = await this.database.prisma.$transaction(async (transaction) => {
      const result = await transaction.seoMetadata.updateMany({
        where: { id: metadataId, ...(updatedAt ? { updatedAt } : {}) },
        data,
      });
      if (result.count !== 1) {
        throw new ConflictException('metadata هم‌زمان تغییر کرده است.');
      }
      const metadata = await transaction.seoMetadata.findUnique({
        where: { id: metadataId },
        select: seoMetadataSelect,
      });
      if (!metadata) throw new NotFoundException('metadata پیدا نشد.');
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'content.seo_metadata.updated',
          resourceType: 'SeoMetadata',
          resourceId: metadata.id,
          metadata: { path: metadata.path, changedFields: Object.keys(data) },
        },
        transaction,
      );
      return metadata;
    });

    return toSeoMetadataView(updated);
  }

  public async removeMetadata(staff: AuthenticatedStaff, metadataIdInput: string): Promise<void> {
    assertStaffRole(staff, 'admin');
    const metadataId = recordId(metadataIdInput, 'شناسه metadata');
    const current = await this.database.prisma.seoMetadata.findUnique({
      where: { id: metadataId },
      select: seoMetadataSelect,
    });
    if (!current) throw new NotFoundException('metadata پیدا نشد.');

    await this.database.prisma.$transaction(async (transaction) => {
      await transaction.seoMetadata.delete({ where: { id: metadataId } });
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'content.seo_metadata.deleted',
          resourceType: 'SeoMetadata',
          resourceId: metadataId,
          metadata: { path: current.path },
        },
        transaction,
      );
    });
  }

  public async listRedirects(
    staff: AuthenticatedStaff,
    query: AdminContentListQueryDto,
  ): Promise<RedirectPageView> {
    assertStaffRole(staff, 'admin');
    const { page, limit } = listBounds(query);
    const q = query.q?.trim();
    const where: Prisma.RedirectWhereInput = q
      ? {
          OR: [
            { fromPath: { contains: q, mode: 'insensitive' } },
            { toPath: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};
    const [total, items] = await Promise.all([
      this.database.prisma.redirect.count({ where }),
      this.database.prisma.redirect.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: redirectSelect,
      }),
    ]);
    return { items: items.map(toRedirectView), total, page, limit };
  }

  public async createRedirect(
    staff: AuthenticatedStaff,
    input: CreateAdminRedirectDto,
  ): Promise<RedirectView> {
    assertStaffRole(staff, 'admin');
    const fromPath = normalizePublicPath(input.fromPath, 'مبدأ redirect');
    const toPath = normalizePublicPath(input.toPath, 'مقصد redirect');
    const statusCode = input.statusCode ?? 301;
    this.assertDistinctPaths(fromPath, toPath);

    try {
      const created = await this.database.prisma.$transaction(async (transaction) => {
        await this.assertNoRedirectCycle(transaction, fromPath, toPath);
        const redirect = await transaction.redirect.create({
          data: { fromPath, toPath, statusCode },
          select: redirectSelect,
        });
        await this.audit.record(
          {
            actorType: 'STAFF',
            actorUserId: staff.id,
            action: 'content.redirect.created',
            resourceType: 'Redirect',
            resourceId: redirect.id,
            metadata: { fromPath: redirect.fromPath, toPath: redirect.toPath, statusCode },
          },
          transaction,
        );
        return redirect;
      });
      return toRedirectView(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('این مبدأ redirect قبلاً ثبت شده است.');
      }
      throw error;
    }
  }

  public async updateRedirect(
    staff: AuthenticatedStaff,
    redirectIdInput: string,
    input: UpdateAdminRedirectDto,
  ): Promise<RedirectView> {
    assertStaffRole(staff, 'admin');
    const redirectId = recordId(redirectIdInput, 'شناسه redirect');
    const current = await this.database.prisma.redirect.findUnique({
      where: { id: redirectId },
      select: redirectSelect,
    });
    if (!current) throw new NotFoundException('redirect پیدا نشد.');
    if (input.toPath === undefined && input.statusCode === undefined) {
      throw new BadRequestException('حداقل یک تغییر برای redirect لازم است.');
    }

    const toPath =
      input.toPath === undefined
        ? current.toPath
        : normalizePublicPath(input.toPath, 'مقصد redirect');
    const statusCode = input.statusCode === undefined ? current.statusCode : input.statusCode;
    this.assertDistinctPaths(current.fromPath, toPath);

    const updated = await this.database.prisma.$transaction(async (transaction) => {
      await this.assertNoRedirectCycle(transaction, current.fromPath, toPath);
      const redirect = await transaction.redirect.update({
        where: { id: redirectId },
        data: { toPath, statusCode },
        select: redirectSelect,
      });
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'content.redirect.updated',
          resourceType: 'Redirect',
          resourceId: redirect.id,
          metadata: {
            fromPath: redirect.fromPath,
            toPath: redirect.toPath,
            statusCode: redirect.statusCode,
          },
        },
        transaction,
      );
      return redirect;
    });

    return toRedirectView(updated);
  }

  public async removeRedirect(staff: AuthenticatedStaff, redirectIdInput: string): Promise<void> {
    assertStaffRole(staff, 'admin');
    const redirectId = recordId(redirectIdInput, 'شناسه redirect');
    const current = await this.database.prisma.redirect.findUnique({
      where: { id: redirectId },
      select: redirectSelect,
    });
    if (!current) throw new NotFoundException('redirect پیدا نشد.');

    await this.database.prisma.$transaction(async (transaction) => {
      await transaction.redirect.delete({ where: { id: redirectId } });
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'content.redirect.deleted',
          resourceType: 'Redirect',
          resourceId: redirectId,
          metadata: { fromPath: current.fromPath, toPath: current.toPath },
        },
        transaction,
      );
    });
  }

  private assertDistinctPaths(fromPath: string, toPath: string): void {
    if (fromPath === toPath) {
      throw new BadRequestException('مبدأ و مقصد redirect باید متفاوت باشند.');
    }
  }

  private async assertNoRedirectCycle(
    database: ContentDatabase,
    fromPath: string,
    toPath: string,
  ): Promise<void> {
    const visited = new Set<string>([fromPath]);
    let path = toPath;

    for (let hop = 0; hop < REDIRECT_CHAIN_LIMIT; hop += 1) {
      const next = await database.redirect.findUnique({
        where: { fromPath: path },
        select: { fromPath: true, toPath: true },
      });
      if (!next) return;
      if (visited.has(next.fromPath) || visited.has(next.toPath)) {
        throw new BadRequestException('redirect چرخه‌ای قابل ثبت نیست.');
      }
      visited.add(next.fromPath);
      path = next.toPath;
    }

    throw new BadRequestException('زنجیره redirect بیش از حد طولانی است.');
  }
}
