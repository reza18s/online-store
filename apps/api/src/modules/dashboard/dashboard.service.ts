import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@nova/db';
import type { OrderStatus, PaymentStatus, ProductStatus, RefundStatus, UserStatus } from '@nova/db';

import { DatabaseService } from '../../database/database.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { assertStaffRole } from '../staff-auth/staff-auth.guard';

export const DEFAULT_DASHBOARD_PERIOD_DAYS = 30;
export const MAX_DASHBOARD_PERIOD_DAYS = 365;

const DAY_MS = 24 * 60 * 60 * 1000;

const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
] as const satisfies readonly OrderStatus[];

export interface DashboardSummaryQuery {
  periodDays?: unknown;
}

export interface DashboardSummaryView {
  publishedProductCount: number;
  newCustomerCount: number;
  newOrderCount: number;
  /** Sum of period Order.totalToman values where paymentStatus is exactly PAID. */
  paidGrossToman: number;
  successfulRefundToman: number;
  orderStatusCounts: Record<OrderStatus, number>;
}

export function parseDashboardPeriodDays(value: unknown): number {
  if (value === undefined) return DEFAULT_DASHBOARD_PERIOD_DAYS;

  const normalized = typeof value === 'string' ? value.trim() : value;
  if (
    (typeof normalized !== 'string' && typeof normalized !== 'number') ||
    (typeof normalized === 'string' && !/^\d+$/.test(normalized))
  ) {
    throw new BadRequestException('بازه زمانی داشبورد معتبر نیست.');
  }

  const periodDays = typeof normalized === 'number' ? normalized : Number(normalized);
  if (
    !Number.isSafeInteger(periodDays) ||
    periodDays < 1 ||
    periodDays > MAX_DASHBOARD_PERIOD_DAYS
  ) {
    throw new BadRequestException('بازه زمانی داشبورد معتبر نیست.');
  }

  return periodDays;
}

@Injectable()
export class DashboardService {
  public constructor(private readonly database: DatabaseService) {}

  public async getSummary(
    staff: AuthenticatedStaff,
    query: DashboardSummaryQuery,
    now?: Date,
  ): Promise<DashboardSummaryView> {
    assertStaffRole(staff, 'admin');

    const periodDays = parseDashboardPeriodDays(query.periodDays);
    const capturedNow = now ?? new Date();
    const periodStart = new Date(capturedNow.getTime() - periodDays * DAY_MS);
    const periodWhere = { createdAt: { gte: periodStart } };
    const publishedProductWhere = {
      status: 'PUBLISHED' as ProductStatus,
    } satisfies Prisma.ProductWhereInput;
    const newCustomerWhere = {
      createdAt: { gte: periodStart },
      status: { not: 'DELETED' as UserStatus },
      staffCredential: { is: null },
      roles: { none: {} },
    } satisfies Prisma.UserWhereInput;
    const paidOrderWhere = {
      createdAt: { gte: periodStart },
      paymentStatus: 'PAID' as PaymentStatus,
    } satisfies Prisma.OrderWhereInput;
    const successfulRefundWhere = {
      createdAt: { gte: periodStart },
      status: 'SUCCEEDED' as RefundStatus,
    } satisfies Prisma.RefundWhereInput;

    try {
      const [
        publishedProductCount,
        newCustomerCount,
        newOrderCount,
        paidGross,
        successfulRefund,
        orderStatuses,
      ] = await Promise.all([
        this.database.prisma.product.count({ where: publishedProductWhere }),
        this.database.prisma.user.count({ where: newCustomerWhere }),
        this.database.prisma.order.count({ where: periodWhere }),
        this.database.prisma.order.aggregate({
          where: paidOrderWhere,
          _sum: { totalToman: true },
        }),
        this.database.prisma.refund.aggregate({
          where: successfulRefundWhere,
          _sum: { amountToman: true },
        }),
        this.database.prisma.order.groupBy({
          by: ['status'],
          where: periodWhere,
          _count: { _all: true },
        }),
      ]);

      const counts = new Map<OrderStatus, number>(
        orderStatuses.map((row) => [row.status, row._count._all]),
      );
      const orderStatusCounts = ORDER_STATUSES.reduce(
        (result, status) => {
          result[status] = counts.get(status) ?? 0;
          return result;
        },
        {} as Record<OrderStatus, number>,
      );

      return {
        publishedProductCount,
        newCustomerCount,
        newOrderCount,
        paidGrossToman: paidGross._sum.totalToman ?? 0,
        successfulRefundToman: successfulRefund._sum.amountToman ?? 0,
        orderStatusCounts,
      };
    } catch {
      throw new InternalServerErrorException('خطای داخلی سرویس.');
    }
  }
}
