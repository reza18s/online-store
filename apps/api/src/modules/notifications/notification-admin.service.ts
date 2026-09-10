import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@nova/db';
import type { NotificationStatus } from '@nova/db';

import { DatabaseService } from '../../database/database.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { assertStaffRole } from '../staff-auth/staff-auth.guard';
import {
  ADMIN_NOTIFICATION_STATUSES,
  AdminNotificationListQueryDto,
} from './dto/admin-notification-list.query';

const notificationSelect = {
  id: true,
  kind: true,
  status: true,
  attempts: true,
  availableAt: true,
  processedAt: true,
  lastError: true,
  createdAt: true,
} satisfies Prisma.NotificationJobSelect;

type NotificationSource = Prisma.NotificationJobGetPayload<{ select: typeof notificationSelect }>;

export interface AdminNotificationView {
  id: string;
  kind: string;
  status: NotificationStatus;
  attempts: number;
  availableAt: Date;
  processedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
}

export interface AdminNotificationPageView {
  items: AdminNotificationView[];
  total: number;
  page: number;
  limit: number;
}

function pageBounds(query: AdminNotificationListQueryDto): { page: number; limit: number } {
  const page = query.page ?? 1;
  const limit = query.limit ?? 24;
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000) {
    throw new BadRequestException('شماره صفحه اعلان معتبر نیست.');
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException('اندازه صفحه اعلان معتبر نیست.');
  }
  return { page, limit };
}

function notificationWhere(query: AdminNotificationListQueryDto): Prisma.NotificationJobWhereInput {
  return {
    ...(query.kind ? { kind: query.kind } : {}),
    ...(query.status && ADMIN_NOTIFICATION_STATUSES.includes(query.status)
      ? { status: query.status }
      : {}),
  };
}

function toNotificationView(source: NotificationSource): AdminNotificationView {
  return { ...source };
}

@Injectable()
export class NotificationAdminService {
  public constructor(private readonly database: DatabaseService) {}

  public async listForStaff(
    staff: AuthenticatedStaff,
    query: AdminNotificationListQueryDto,
  ): Promise<AdminNotificationPageView> {
    assertStaffRole(staff, 'operations', 'admin');
    const { page, limit } = pageBounds(query);
    const where = notificationWhere(query);
    const [total, jobs] = await Promise.all([
      this.database.prisma.notificationJob.count({ where }),
      this.database.prisma.notificationJob.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: notificationSelect,
      }),
    ]);
    return { items: jobs.map(toNotificationView), total, page, limit };
  }
}
