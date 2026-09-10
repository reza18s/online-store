import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { AdminNotificationPage, ApiEnvelope } from '@nova/api-client';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import {
  RequireStaffRoles,
  StaffAuthGuard,
  StaffRoleGuard,
  type StaffRequest,
} from '../staff-auth/staff-auth.guard';
import { AdminNotificationListQueryDto } from './dto/admin-notification-list.query';
import {
  NotificationAdminService,
  type AdminNotificationPageView,
  type AdminNotificationView,
} from './notification-admin.service';

@Controller('admin/notifications')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
@RequireStaffRoles('operations', 'admin')
export class NotificationAdminController {
  public constructor(private readonly notifications: NotificationAdminService) {}

  @Get()
  public async list(
    @Query() query: AdminNotificationListQueryDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminNotificationPage>> {
    return this.envelope(
      request,
      toAdminNotificationPage(await this.notifications.listForStaff(this.staff(request), query)),
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

function toAdminNotificationPage(source: AdminNotificationPageView): AdminNotificationPage {
  return {
    items: source.items.map(toAdminNotification),
    total: source.total,
    page: source.page,
    limit: source.limit,
  };
}

function toAdminNotification(source: AdminNotificationView) {
  return {
    id: source.id,
    kind: source.kind,
    status: source.status,
    attempts: source.attempts,
    availableAt: source.availableAt.toISOString(),
    processedAt: source.processedAt?.toISOString() ?? null,
    lastError: source.lastError,
    createdAt: source.createdAt.toISOString(),
  };
}
