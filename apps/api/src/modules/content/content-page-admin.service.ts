import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@nova/db';

import { DatabaseService } from '../../database/database.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { assertStaffRole } from '../staff-auth/staff-auth.guard';
import {
  CONTENT_BLOCK_KIND_PATTERN,
  CreateAdminContentPageDto,
  UpdateAdminContentPageDto,
  UpdateAdminContentPageStatusDto,
} from './dto/admin-content-page.dto';
import {
  AdminContentPageListQueryDto,
  type AdminContentStatus,
} from './dto/admin-content-page.query';
import { normalizeContentJson } from './content-json';
import { normalizeContentSlug } from './content-page.service';

const adminContentPageListSelect = {
  id: true,
  slug: true,
  title: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ContentPageSelect;

const adminContentPageSelect = {
  ...adminContentPageListSelect,
  body: true,
  blocks: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      kind: true,
      payload: true,
      sortOrder: true,
    },
  },
} as const satisfies Prisma.ContentPageSelect;

type AdminContentPageListSource = Prisma.ContentPageGetPayload<{
  select: typeof adminContentPageListSelect;
}>;
type AdminContentPageSource = Prisma.ContentPageGetPayload<{
  select: typeof adminContentPageSelect;
}>;

export interface AdminContentPageListItemView {
  id: string;
  slug: string;
  title: string;
  status: AdminContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminContentPageView extends AdminContentPageListItemView {
  body: string | null;
  blocks: Array<{
    id: string;
    kind: string;
    payload: Prisma.JsonValue;
    sortOrder: number;
  }>;
}

export interface AdminContentPagePageView {
  items: AdminContentPageListItemView[];
  total: number;
  page: number;
  limit: number;
}

const ALLOWED_STATUS_TRANSITIONS: Record<AdminContentStatus, readonly AdminContentStatus[]> = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['DRAFT', 'ARCHIVED'],
  ARCHIVED: ['DRAFT'],
};

function normalizeRequiredText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new BadRequestException(`${field} نمی‌تواند خالی باشد.`);
  return normalized;
}

function normalizeOptionalBody(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const normalized = value.trim();
  return normalized || null;
}

function normalizeBlockInput(
  blocks: Array<{ kind: string; payload?: unknown; sortOrder?: number }> | undefined,
) {
  return (blocks ?? []).map((block, index) => {
    const kind = block.kind.trim().toLowerCase();
    const sortOrder = block.sortOrder ?? index;
    if (!CONTENT_BLOCK_KIND_PATTERN.test(kind)) {
      throw new BadRequestException('نوع بلاک محتوا معتبر نیست.');
    }
    if (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > 100_000) {
      throw new BadRequestException('ترتیب بلاک محتوا معتبر نیست.');
    }
    return {
      kind,
      payload: normalizeContentJson(block.payload, 'payload بلاک محتوا'),
      sortOrder,
    };
  });
}

function recordId(value: string): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(value)) {
    throw new BadRequestException('شناسه صفحه محتوا معتبر نیست.');
  }
  return value;
}

function expectedDate(value: string | undefined): Date | undefined {
  if (value === undefined) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('زمان ویرایش صفحه محتوا معتبر نیست.');
  }
  return date;
}

function toListItem(source: AdminContentPageListSource): AdminContentPageListItemView {
  return {
    id: source.id,
    slug: source.slug,
    title: source.title,
    status: source.status as AdminContentStatus,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

function toAdminPage(source: AdminContentPageSource): AdminContentPageView {
  return {
    ...toListItem(source),
    body: source.body,
    blocks: source.blocks.map((block) => ({
      id: block.id,
      kind: block.kind,
      payload: block.payload,
      sortOrder: block.sortOrder,
    })),
  };
}

function assertPublishable(
  source: Pick<AdminContentPageSource, 'title' | 'body' | 'blocks'>,
): void {
  if (!source.title.trim() || (!source.body?.trim() && source.blocks.length === 0)) {
    throw new BadRequestException('صفحه محتوا برای انتشار باید متن یا بلاک داشته باشد.');
  }
}

@Injectable()
export class ContentPageAdminService {
  public constructor(
    private readonly database: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  public async list(
    staff: AuthenticatedStaff,
    query: AdminContentPageListQueryDto,
  ): Promise<AdminContentPagePageView> {
    assertStaffRole(staff, 'admin');
    const page = query.page ?? 1;
    const limit = query.limit ?? 24;
    const q = query.q?.trim();
    const where: Prisma.ContentPageWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(q
        ? {
            OR: [
              { slug: { contains: q, mode: 'insensitive' } },
              { title: { contains: q, mode: 'insensitive' } },
              { body: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.database.prisma.contentPage.count({ where }),
      this.database.prisma.contentPage.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: adminContentPageListSelect,
      }),
    ]);
    return { items: items.map(toListItem), total, page, limit };
  }

  public async get(staff: AuthenticatedStaff, pageIdInput: string): Promise<AdminContentPageView> {
    assertStaffRole(staff, 'admin');
    const pageId = recordId(pageIdInput);
    const page = await this.database.prisma.contentPage.findUnique({
      where: { id: pageId },
      select: adminContentPageSelect,
    });
    if (!page) throw new NotFoundException('صفحه محتوا پیدا نشد.');
    return toAdminPage(page);
  }

  public async create(
    staff: AuthenticatedStaff,
    input: CreateAdminContentPageDto,
  ): Promise<AdminContentPageView> {
    assertStaffRole(staff, 'admin');
    const slug = normalizeContentSlug(input.slug);
    const title = normalizeRequiredText(input.title, 'عنوان صفحه محتوا');
    const body = normalizeOptionalBody(input.body);
    const blocks = normalizeBlockInput(input.blocks);

    try {
      const created = await this.database.prisma.$transaction(async (transaction) => {
        const page = await transaction.contentPage.create({
          data: {
            slug,
            title,
            body,
            status: 'DRAFT',
            blocks: {
              create: blocks,
            },
          },
          select: adminContentPageSelect,
        });
        await this.audit.record(
          {
            actorType: 'STAFF',
            actorUserId: staff.id,
            action: 'content.page.created',
            resourceType: 'ContentPage',
            resourceId: page.id,
            metadata: { slug: page.slug, status: page.status, blockCount: blocks.length },
          },
          transaction,
        );
        return page;
      });
      return toAdminPage(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('این slug صفحه محتوا قبلاً ثبت شده است.');
      }
      throw error;
    }
  }

  public async update(
    staff: AuthenticatedStaff,
    pageIdInput: string,
    input: UpdateAdminContentPageDto,
  ): Promise<AdminContentPageView> {
    assertStaffRole(staff, 'admin');
    const pageId = recordId(pageIdInput);
    const current = await this.database.prisma.contentPage.findUnique({
      where: { id: pageId },
      select: adminContentPageSelect,
    });
    if (!current) throw new NotFoundException('صفحه محتوا پیدا نشد.');

    const blocks = input.blocks === undefined ? undefined : normalizeBlockInput(input.blocks);
    if (input.title === undefined && input.body === undefined && blocks === undefined) {
      throw new BadRequestException('حداقل یک تغییر برای صفحه محتوا لازم است.');
    }
    const data: Prisma.ContentPageUpdateManyMutationInput = {
      ...(input.title === undefined
        ? {}
        : { title: normalizeRequiredText(input.title, 'عنوان صفحه محتوا') }),
      ...(input.body === undefined ? {} : { body: normalizeOptionalBody(input.body) }),
      updatedAt: new Date(),
    };
    const updatedAt = expectedDate(input.expectedUpdatedAt);

    const updated = await this.database.prisma.$transaction(async (transaction) => {
      const result = await transaction.contentPage.updateMany({
        where: { id: pageId, ...(updatedAt ? { updatedAt } : {}) },
        data,
      });
      if (result.count !== 1) {
        throw new ConflictException('صفحه محتوا هم‌زمان تغییر کرده است.');
      }
      if (blocks !== undefined) {
        await transaction.contentBlock.deleteMany({ where: { contentPageId: pageId } });
        if (blocks.length > 0) {
          await transaction.contentBlock.createMany({
            data: blocks.map((block) => ({ ...block, contentPageId: pageId })),
          });
        }
      }
      const page = await transaction.contentPage.findUnique({
        where: { id: pageId },
        select: adminContentPageSelect,
      });
      if (!page) throw new NotFoundException('صفحه محتوا پیدا نشد.');
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'content.page.updated',
          resourceType: 'ContentPage',
          resourceId: page.id,
          metadata: {
            slug: page.slug,
            changedFields: [
              ...(input.title === undefined ? [] : ['title']),
              ...(input.body === undefined ? [] : ['body']),
              ...(blocks === undefined ? [] : ['blocks']),
            ],
          },
        },
        transaction,
      );
      return page;
    });

    return toAdminPage(updated);
  }

  public async updateStatus(
    staff: AuthenticatedStaff,
    pageIdInput: string,
    input: UpdateAdminContentPageStatusDto,
  ): Promise<AdminContentPageView> {
    assertStaffRole(staff, 'admin');
    const pageId = recordId(pageIdInput);
    const current = await this.database.prisma.contentPage.findUnique({
      where: { id: pageId },
      select: adminContentPageSelect,
    });
    if (!current) throw new NotFoundException('صفحه محتوا پیدا نشد.');
    if (current.status === input.status) return toAdminPage(current);
    if (!ALLOWED_STATUS_TRANSITIONS[current.status].includes(input.status)) {
      throw new BadRequestException('تغییر وضعیت صفحه محتوا مجاز نیست.');
    }
    if (input.status === 'PUBLISHED') assertPublishable(current);
    const updatedAt = expectedDate(input.expectedUpdatedAt);

    const updated = await this.database.prisma.$transaction(async (transaction) => {
      const result = await transaction.contentPage.updateMany({
        where: { id: pageId, ...(updatedAt ? { updatedAt } : {}) },
        data: { status: input.status, updatedAt: new Date() },
      });
      if (result.count !== 1) {
        throw new ConflictException('صفحه محتوا هم‌زمان تغییر کرده است.');
      }
      const page = await transaction.contentPage.findUnique({
        where: { id: pageId },
        select: adminContentPageSelect,
      });
      if (!page) throw new NotFoundException('صفحه محتوا پیدا نشد.');
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'content.page.status_changed',
          resourceType: 'ContentPage',
          resourceId: page.id,
          metadata: { slug: page.slug, fromStatus: current.status, toStatus: page.status },
        },
        transaction,
      );
      return page;
    });

    return toAdminPage(updated);
  }
}
