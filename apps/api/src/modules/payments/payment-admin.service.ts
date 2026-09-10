import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@nova/db';
import type { OrderStatus, PaymentAttemptStatus, PaymentStatus, RefundStatus } from '@nova/db';

import { DatabaseService } from '../../database/database.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { assertStaffRole } from '../staff-auth/staff-auth.guard';
import {
  ADMIN_PAYMENT_ATTEMPT_STATUSES,
  AdminPaymentListQueryDto,
} from './dto/admin-payment-list.query';

const paymentAdminSelect = {
  id: true,
  orderId: true,
  provider: true,
  providerTransactionId: true,
  status: true,
  amountToman: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
  order: {
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
    },
  },
  refunds: {
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      amountToman: true,
      status: true,
      providerRefundId: true,
      reason: true,
      createdAt: true,
      completedAt: true,
    },
  },
} satisfies Prisma.PaymentAttemptSelect;

interface PaymentAdminSource {
  id: string;
  orderId: string;
  provider: string;
  providerTransactionId: string | null;
  status: PaymentAttemptStatus;
  amountToman: number;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
  order: {
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
  };
  refunds: Array<{
    id: string;
    amountToman: number;
    status: RefundStatus;
    providerRefundId: string | null;
    reason: string | null;
    createdAt: Date;
    completedAt: Date | null;
  }>;
}

export interface AdminPaymentRefundView {
  id: string;
  amountToman: number;
  status: RefundStatus;
  providerRefundId: string | null;
  reason: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface AdminPaymentAttemptView {
  id: string;
  orderId: string;
  orderNumber: string;
  provider: string;
  providerTransactionId: string | null;
  status: PaymentAttemptStatus;
  amountToman: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
  refunds: AdminPaymentRefundView[];
}

export interface AdminPaymentPageView {
  items: AdminPaymentAttemptView[];
  total: number;
  page: number;
  limit: number;
}

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;
const ORDER_NUMBER_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function assertIdentifier(value: string, message: string): void {
  if (!IDENTIFIER_PATTERN.test(value)) throw new BadRequestException(message);
}

function assertOrderNumber(value: string): void {
  if (!ORDER_NUMBER_PATTERN.test(value)) {
    throw new BadRequestException('شماره سفارش پرداخت معتبر نیست.');
  }
}

function listBounds(query: AdminPaymentListQueryDto): { page: number; limit: number } {
  const page = query.page ?? 1;
  const limit = query.limit ?? 24;
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000) {
    throw new BadRequestException('شماره صفحه پرداخت معتبر نیست.');
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException('اندازه صفحه پرداخت معتبر نیست.');
  }
  return { page, limit };
}

function paymentWhere(query: AdminPaymentListQueryDto): Prisma.PaymentAttemptWhereInput {
  if (query.provider !== undefined) assertIdentifier(query.provider, 'شناسه درگاه پرداخت معتبر نیست.');
  if (query.orderNumber !== undefined) assertOrderNumber(query.orderNumber);
  return {
    ...(query.status && ADMIN_PAYMENT_ATTEMPT_STATUSES.includes(query.status)
      ? { status: query.status }
      : {}),
    ...(query.provider ? { provider: query.provider } : {}),
    ...(query.orderNumber ? { order: { orderNumber: query.orderNumber } } : {}),
  };
}

function toPaymentView(source: PaymentAdminSource): AdminPaymentAttemptView {
  return {
    id: source.id,
    orderId: source.orderId,
    orderNumber: source.order.orderNumber,
    provider: source.provider,
    providerTransactionId: source.providerTransactionId,
    status: source.status,
    amountToman: source.amountToman,
    orderStatus: source.order.status,
    paymentStatus: source.order.paymentStatus,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    paidAt: source.paidAt,
    refunds: source.refunds.map((refund) => ({ ...refund })),
  };
}

@Injectable()
export class PaymentAdminService {
  public constructor(private readonly database: DatabaseService) {}

  public async list(
    staff: AuthenticatedStaff,
    query: AdminPaymentListQueryDto,
  ): Promise<AdminPaymentPageView> {
    assertStaffRole(staff, 'admin');
    const { page, limit } = listBounds(query);
    const where = paymentWhere(query);
    const [total, attempts] = await Promise.all([
      this.database.prisma.paymentAttempt.count({ where }),
      this.database.prisma.paymentAttempt.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: paymentAdminSelect,
      }),
    ]);
    return {
      items: attempts.map((attempt) => toPaymentView(attempt)),
      total,
      page,
      limit,
    };
  }

  public async get(staff: AuthenticatedStaff, paymentAttemptId: string): Promise<AdminPaymentAttemptView> {
    assertStaffRole(staff, 'admin');
    assertIdentifier(paymentAttemptId, 'شناسه تلاش پرداخت معتبر نیست.');
    const attempt = await this.database.prisma.paymentAttempt.findUnique({
      where: { id: paymentAttemptId },
      select: paymentAdminSelect,
    });
    if (!attempt) throw new NotFoundException('تلاش پرداخت پیدا نشد.');
    return toPaymentView(attempt);
  }
}
