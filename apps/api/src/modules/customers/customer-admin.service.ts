import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@nova/db';
import type { OrderStatus, UserStatus } from '@nova/db';

import { DatabaseService } from '../../database/database.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { assertStaffRole } from '../staff-auth/staff-auth.guard';
import {
  ADMIN_CUSTOMER_STATUSES,
  AdminCustomerListQueryDto,
} from './dto/admin-customer-list.query';

const customerSelect = {
  id: true,
  phone: true,
  email: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { orders: true } },
  orders: {
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 1,
    select: { orderNumber: true, status: true, createdAt: true },
  },
} satisfies Prisma.UserSelect;

type CustomerSource = Prisma.UserGetPayload<{ select: typeof customerSelect }>;

export interface AdminCustomerView {
  id: string;
  phone: string;
  email: string | null;
  status: UserStatus;
  orderCount: number;
  lastOrderNumber: string | null;
  lastOrderStatus: OrderStatus | null;
  lastOrderAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCustomerPageView {
  items: AdminCustomerView[];
  total: number;
  page: number;
  limit: number;
}

function phoneSearchValues(value: string): string[] {
  const normalized = value
    .normalize('NFKC')
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\s()-]/g, '');
  const values = new Set([value, normalized]);
  if (normalized.startsWith('0')) values.add(`+98${normalized.slice(1)}`);
  if (normalized.startsWith('98')) values.add(`+${normalized}`);
  return [...values].filter(Boolean);
}

function customerWhere(query: AdminCustomerListQueryDto): Prisma.UserWhereInput {
  const q = query.q?.trim();
  const phoneValues = q ? phoneSearchValues(q) : [];
  return {
    staffCredential: null,
    roles: { none: {} },
    ...(query.status && ADMIN_CUSTOMER_STATUSES.includes(query.status)
      ? { status: query.status }
      : {}),
    ...(q
      ? {
          OR: [
            ...phoneValues.map((value) => ({ phone: { contains: value, mode: 'insensitive' as const } })),
            { email: { contains: q, mode: 'insensitive' as const } },
            ...( /^[A-Za-z0-9_-]{1,128}$/.test(q) ? [{ id: q }] : []),
          ],
        }
      : {}),
  };
}

function pageBounds(query: AdminCustomerListQueryDto): { page: number; limit: number } {
  const page = query.page ?? 1;
  const limit = query.limit ?? 24;
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000) {
    throw new BadRequestException('شماره صفحه مشتری معتبر نیست.');
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException('اندازه صفحه مشتری معتبر نیست.');
  }
  return { page, limit };
}

function toCustomerView(source: CustomerSource): AdminCustomerView {
  const lastOrder = source.orders[0];
  return {
    id: source.id,
    phone: source.phone,
    email: source.email,
    status: source.status,
    orderCount: source._count.orders,
    lastOrderNumber: lastOrder?.orderNumber ?? null,
    lastOrderStatus: lastOrder?.status ?? null,
    lastOrderAt: lastOrder?.createdAt ?? null,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

@Injectable()
export class CustomerAdminService {
  public constructor(private readonly database: DatabaseService) {}

  public async listForStaff(
    staff: AuthenticatedStaff,
    query: AdminCustomerListQueryDto,
  ): Promise<AdminCustomerPageView> {
    assertStaffRole(staff, 'support', 'operations', 'admin');
    const { page, limit } = pageBounds(query);
    const where = customerWhere(query);
    const [total, customers] = await Promise.all([
      this.database.prisma.user.count({ where }),
      this.database.prisma.user.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: customerSelect,
      }),
    ]);
    return { items: customers.map(toCustomerView), total, page, limit };
  }
}
