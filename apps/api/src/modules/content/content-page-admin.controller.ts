import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type {
  AdminContentPage,
  AdminContentPagePage,
  AdminContentStatus,
  ApiEnvelope,
} from '@nova/api-client';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import {
  RequireStaffRoles,
  StaffAuthGuard,
  StaffRoleGuard,
  type StaffRequest,
} from '../staff-auth/staff-auth.guard';
import {
  CreateAdminContentPageDto,
  UpdateAdminContentPageDto,
  UpdateAdminContentPageStatusDto,
} from './dto/admin-content-page.dto';
import { AdminContentPageListQueryDto } from './dto/admin-content-page.query';
import {
  ContentPageAdminService,
  type AdminContentPageListItemView,
  type AdminContentPagePageView,
  type AdminContentPageView,
} from './content-page-admin.service';

@Controller('admin/content/pages')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
@RequireStaffRoles('admin')
export class ContentPageAdminController {
  public constructor(private readonly pages: ContentPageAdminService) {}

  @Get()
  public async list(
    @Query() query: AdminContentPageListQueryDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminContentPagePage>> {
    return this.envelope(request, toPage(await this.pages.list(this.staff(request), query)));
  }

  @Get(':pageId')
  public async get(
    @Param('pageId') pageId: string,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminContentPage>> {
    return this.envelope(request, toAdminPage(await this.pages.get(this.staff(request), pageId)));
  }

  @Post()
  public async create(
    @Body() body: CreateAdminContentPageDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminContentPage>> {
    return this.envelope(request, toAdminPage(await this.pages.create(this.staff(request), body)));
  }

  @Patch(':pageId')
  public async update(
    @Param('pageId') pageId: string,
    @Body() body: UpdateAdminContentPageDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminContentPage>> {
    return this.envelope(
      request,
      toAdminPage(await this.pages.update(this.staff(request), pageId, body)),
    );
  }

  @Patch(':pageId/status')
  public async updateStatus(
    @Param('pageId') pageId: string,
    @Body() body: UpdateAdminContentPageStatusDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminContentPage>> {
    return this.envelope(
      request,
      toAdminPage(await this.pages.updateStatus(this.staff(request), pageId, body)),
    );
  }

  private staff(request: StaffRequest) {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return request.staff;
  }

  private envelope<T>(request: RequestWithId, data: T): ApiEnvelope<T> {
    return {
      data,
      meta: {
        requestId: request.requestId ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

function toPage(source: AdminContentPagePageView): AdminContentPagePage {
  return {
    items: source.items.map(toListItem),
    total: source.total,
    page: source.page,
    limit: source.limit,
  };
}

function toListItem(source: AdminContentPageListItemView) {
  return {
    id: source.id,
    slug: source.slug,
    title: source.title,
    status: source.status,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

function toAdminPage(source: AdminContentPageView): AdminContentPage {
  return {
    id: source.id,
    slug: source.slug,
    title: source.title,
    status: source.status as AdminContentStatus,
    body: source.body,
    blocks: source.blocks,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}
