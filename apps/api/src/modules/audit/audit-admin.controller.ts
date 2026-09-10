import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { AdminAuditEvent, AdminAuditPage, ApiEnvelope } from '@nova/api-client';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import {
  RequireStaffRoles,
  StaffAuthGuard,
  StaffRoleGuard,
  type StaffRequest,
} from '../staff-auth/staff-auth.guard';
import { AdminAuditListQueryDto } from './dto/admin-audit-list.query';
import {
  AuditAdminService,
  type AdminAuditEventView,
  type AdminAuditPageView,
} from './audit-admin.service';

@Controller('admin/audit-events')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
@RequireStaffRoles('admin')
export class AuditAdminController {
  public constructor(private readonly audit: AuditAdminService) {}

  @Get()
  public async list(
    @Query() query: AdminAuditListQueryDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminAuditPage>> {
    return this.envelope(request, toAdminAuditPage(await this.audit.list(this.staff(request), query)));
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

function toAdminAuditPage(source: AdminAuditPageView): AdminAuditPage {
  return {
    items: source.items.map(toAdminAuditEvent),
    total: source.total,
    page: source.page,
    limit: source.limit,
  };
}

function toAdminAuditEvent(source: AdminAuditEventView): AdminAuditEvent {
  return {
    id: source.id,
    actorType: source.actorType,
    actorUserId: source.actorUserId,
    action: source.action,
    resourceType: source.resourceType,
    resourceId: source.resourceId,
    metadata: source.metadata,
    createdAt: source.createdAt.toISOString(),
  };
}
