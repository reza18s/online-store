import type { ContentPage as ContentPageResponse, ContentPageSummary } from '@nova/api-client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@nova/db';

import { DatabaseService } from '../../database/database.service';
import { CONTENT_PAGE_SLUG_MAX_LENGTH, CONTENT_PAGE_SLUG_PATTERN } from './content-page.constants';

const publicContentPageSelect = {
  slug: true,
  title: true,
  body: true,
  blocks: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      kind: true,
      payload: true,
      sortOrder: true,
    },
  },
} as const satisfies Prisma.ContentPageSelect;

const publicContentPageSummarySelect = {
  slug: true,
  title: true,
  updatedAt: true,
} as const satisfies Prisma.ContentPageSelect;

type PublicContentPageSource = Prisma.ContentPageGetPayload<{
  select: typeof publicContentPageSelect;
}>;

type PublicContentPageSummarySource = Prisma.ContentPageGetPayload<{
  select: typeof publicContentPageSummarySelect;
}>;

export function normalizeContentSlug(value: string): string {
  if (typeof value !== 'string') throw new BadRequestException('شناسه صفحه محتوا معتبر نیست.');

  const slug = value.trim().toLowerCase();
  if (
    slug.length === 0 ||
    slug.length > CONTENT_PAGE_SLUG_MAX_LENGTH ||
    !CONTENT_PAGE_SLUG_PATTERN.test(slug)
  ) {
    throw new BadRequestException('شناسه صفحه محتوا معتبر نیست.');
  }
  return slug;
}

function toPublicContentPage(source: PublicContentPageSource): ContentPageResponse {
  return {
    slug: source.slug,
    title: source.title,
    body: source.body,
    blocks: source.blocks.map((block) => ({
      kind: block.kind,
      payload: block.payload,
      sortOrder: block.sortOrder,
    })),
  };
}

function toPublicContentPageSummary(source: PublicContentPageSummarySource): ContentPageSummary {
  return {
    slug: source.slug,
    title: source.title,
    updatedAt: source.updatedAt.toISOString(),
  };
}

@Injectable()
export class ContentPageService {
  public constructor(private readonly database: DatabaseService) {}

  public async listPublishedPages(): Promise<ContentPageSummary[]> {
    // The sitemap index must discover every published page, so this read is
    // deliberately complete rather than silently truncated by a fixed take.
    const pages = await this.database.prisma.contentPage.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ slug: 'asc' }],
      select: publicContentPageSummarySelect,
    });
    return pages.map(toPublicContentPageSummary);
  }

  public async getPublishedPage(slugInput: string): Promise<ContentPageResponse> {
    const slug = normalizeContentSlug(slugInput);
    const page = await this.database.prisma.contentPage.findFirst({
      where: { slug, status: 'PUBLISHED' },
      select: publicContentPageSelect,
    });
    if (!page) throw new NotFoundException('صفحه محتوا پیدا نشد.');
    return toPublicContentPage(page);
  }
}
