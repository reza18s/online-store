import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  AdminRedirect,
  AdminRedirectPage,
  AdminSeoMetadata,
  AdminSeoMetadataPage,
  ApiEnvelope,
  SeoResolution,
  ContentPage as ContentPageResponse,
  ContentPageSummary,
} from '@nova/api-client';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import {
  RequireStaffRoles,
  StaffAuthGuard,
  StaffRoleGuard,
  type StaffRequest,
} from '../staff-auth/staff-auth.guard';
import {
  CreateAdminRedirectDto,
  CreateAdminSeoMetadataDto,
  UpdateAdminRedirectDto,
  UpdateAdminSeoMetadataDto,
} from './dto/seo.dto';
import { AdminContentListQueryDto, SeoResolveQueryDto } from './dto/seo.query';
import {
  SeoService,
  type RedirectPageView,
  type RedirectView,
  type SeoMetadataPageView,
  type SeoMetadataView,
} from './seo.service';
import { ContentPageService } from './content-page.service';

@Controller('content')
export class ContentController {
  public constructor(private readonly content: ContentPageService) {}

  @Get('pages')
  public async index(@Req() request: RequestWithId): Promise<ApiEnvelope<ContentPageSummary[]>> {
    return this.envelope(request, await this.content.listPublishedPages());
  }

  @Get('pages/:slug')
  public async page(
    @Param('slug') slug: string,
    @Req() request: RequestWithId,
  ): Promise<ApiEnvelope<ContentPageResponse>> {
    return this.envelope(request, await this.content.getPublishedPage(slug));
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

@Controller('seo')
export class SeoController {
  public constructor(private readonly seo: SeoService) {}

  @Get('resolve')
  public async resolve(
    @Query() query: SeoResolveQueryDto,
    @Req() request: RequestWithId,
  ): Promise<ApiEnvelope<SeoResolution>> {
    return this.envelope(request, await this.seo.resolve(query.path));
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

@Controller('admin/content/seo-metadata')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
@RequireStaffRoles('admin')
export class SeoMetadataAdminController {
  public constructor(private readonly seo: SeoService) {}

  @Get()
  public async list(
    @Query() query: AdminContentListQueryDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminSeoMetadataPage>> {
    return this.envelope(
      request,
      toAdminSeoMetadataPage(await this.seo.listMetadata(this.staff(request), query)),
    );
  }

  @Post()
  public async create(
    @Body() body: CreateAdminSeoMetadataDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminSeoMetadata>> {
    return this.envelope(
      request,
      toAdminSeoMetadata(await this.seo.createMetadata(this.staff(request), body)),
    );
  }

  @Patch(':metadataId')
  public async update(
    @Param('metadataId') metadataId: string,
    @Body() body: UpdateAdminSeoMetadataDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminSeoMetadata>> {
    return this.envelope(
      request,
      toAdminSeoMetadata(await this.seo.updateMetadata(this.staff(request), metadataId, body)),
    );
  }

  @Delete(':metadataId')
  public async remove(
    @Param('metadataId') metadataId: string,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<null>> {
    await this.seo.removeMetadata(this.staff(request), metadataId);
    return this.envelope(request, null);
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

@Controller('admin/content/redirects')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
@RequireStaffRoles('admin')
export class RedirectAdminController {
  public constructor(private readonly seo: SeoService) {}

  @Get()
  public async list(
    @Query() query: AdminContentListQueryDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminRedirectPage>> {
    return this.envelope(
      request,
      toAdminRedirectPage(await this.seo.listRedirects(this.staff(request), query)),
    );
  }

  @Post()
  public async create(
    @Body() body: CreateAdminRedirectDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminRedirect>> {
    return this.envelope(
      request,
      toAdminRedirect(await this.seo.createRedirect(this.staff(request), body)),
    );
  }

  @Patch(':redirectId')
  public async update(
    @Param('redirectId') redirectId: string,
    @Body() body: UpdateAdminRedirectDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminRedirect>> {
    return this.envelope(
      request,
      toAdminRedirect(await this.seo.updateRedirect(this.staff(request), redirectId, body)),
    );
  }

  @Delete(':redirectId')
  public async remove(
    @Param('redirectId') redirectId: string,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<null>> {
    await this.seo.removeRedirect(this.staff(request), redirectId);
    return this.envelope(request, null);
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

function toAdminSeoMetadata(source: SeoMetadataView): AdminSeoMetadata {
  return {
    id: source.id,
    path: source.path,
    title: source.title,
    description: source.description,
    canonicalUrl: source.canonicalUrl,
    noIndex: source.noIndex,
    structuredData: source.structuredData,
    updatedAt: source.updatedAt.toISOString(),
  };
}

function toAdminSeoMetadataPage(source: SeoMetadataPageView): AdminSeoMetadataPage {
  return {
    items: source.items.map(toAdminSeoMetadata),
    total: source.total,
    page: source.page,
    limit: source.limit,
  };
}

function toAdminRedirect(source: RedirectView): AdminRedirect {
  return {
    id: source.id,
    fromPath: source.fromPath,
    toPath: source.toPath,
    statusCode: source.statusCode,
    createdAt: source.createdAt.toISOString(),
  };
}

function toAdminRedirectPage(source: RedirectPageView): AdminRedirectPage {
  return {
    items: source.items.map(toAdminRedirect),
    total: source.total,
    page: source.page,
    limit: source.limit,
  };
}
