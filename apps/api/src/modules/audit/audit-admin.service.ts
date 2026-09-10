import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@nova/db';
import type { ActorType } from '@nova/db';

import { DatabaseService } from '../../database/database.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { assertStaffRole } from '../staff-auth/staff-auth.guard';
import { AdminAuditListQueryDto } from './dto/admin-audit-list.query';

const auditEventSelect = {
  id: true,
  actorType: true,
  actorUserId: true,
  action: true,
  resourceType: true,
  resourceId: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.AuditEventSelect;

export interface AdminAuditEventView {
  id: string;
  actorType: ActorType;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}

export interface AdminAuditPageView {
  items: AdminAuditEventView[];
  total: number;
  page: number;
  limit: number;
}

function assertIdentifier(value: string, message: string): void {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(value)) throw new BadRequestException(message);
}

function listBounds(query: AdminAuditListQueryDto): { page: number; limit: number } {
  const page = query.page ?? 1;
  const limit = query.limit ?? 24;
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000) {
    throw new BadRequestException('شماره صفحه گزارش رویداد معتبر نیست.');
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException('اندازه صفحه گزارش رویداد معتبر نیست.');
  }
  return { page, limit };
}

function auditWhere(query: AdminAuditListQueryDto): Prisma.AuditEventWhereInput {
  if (query.actorUserId !== undefined) assertIdentifier(query.actorUserId, 'شناسه کاربر گزارش معتبر نیست.');
  return {
    ...(query.action ? { action: query.action } : {}),
    ...(query.resourceType ? { resourceType: query.resourceType } : {}),
    ...(query.resourceId ? { resourceId: query.resourceId } : {}),
    ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
    ...(query.actorType ? { actorType: query.actorType } : {}),
  };
}

@Injectable()
export class AuditAdminService {
  public constructor(private readonly database: DatabaseService) {}

  public async list(
    staff: AuthenticatedStaff,
    query: AdminAuditListQueryDto,
  ): Promise<AdminAuditPageView> {
    assertStaffRole(staff, 'admin');
    const { page, limit } = listBounds(query);
    const where = auditWhere(query);
    const [total, events] = await Promise.all([
      this.database.prisma.auditEvent.count({ where }),
      this.database.prisma.auditEvent.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: auditEventSelect,
      }),
    ]);

    return {
      items: events.map((event) => ({ ...event })),
      total,
      page,
      limit,
    };
  }
}
