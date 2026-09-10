import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { AdminPaymentAttempt, AdminPaymentPage, ApiEnvelope } from '@nova/api-client';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import {
  RequireStaffRoles,
  StaffAuthGuard,
  StaffRoleGuard,
  type StaffRequest,
} from '../staff-auth/staff-auth.guard';
import { AdminPaymentListQueryDto } from './dto/admin-payment-list.query';
import {
  PaymentAdminService,
  type AdminPaymentAttemptView,
  type AdminPaymentPageView,
} from './payment-admin.service';

@Controller('admin/payments')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
@RequireStaffRoles('admin')
export class PaymentAdminController {
  public constructor(private readonly payments: PaymentAdminService) {}

  @Get()
  public async list(
    @Query() query: AdminPaymentListQueryDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminPaymentPage>> {
    return this.envelope(request, toAdminPaymentPage(await this.payments.list(this.staff(request), query)));
  }

  @Get(':paymentAttemptId')
  public async detail(
    @Param('paymentAttemptId') paymentAttemptId: string,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminPaymentAttempt>> {
    return this.envelope(
      request,
      toAdminPaymentAttempt(await this.payments.get(this.staff(request), paymentAttemptId)),
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

function toAdminPaymentPage(source: AdminPaymentPageView): AdminPaymentPage {
  return {
    items: source.items.map(toAdminPaymentAttempt),
    total: source.total,
    page: source.page,
    limit: source.limit,
  };
}

function toAdminPaymentAttempt(source: AdminPaymentAttemptView): AdminPaymentAttempt {
  return {
    id: source.id,
    orderId: source.orderId,
    orderNumber: source.orderNumber,
    provider: source.provider,
    providerTransactionId: source.providerTransactionId,
    status: source.status,
    amountToman: source.amountToman,
    orderStatus: source.orderStatus,
    paymentStatus: source.paymentStatus,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
    paidAt: source.paidAt?.toISOString() ?? null,
    refunds: source.refunds.map((refund) => ({
      id: refund.id,
      amountToman: refund.amountToman,
      status: refund.status,
      providerRefundId: refund.providerRefundId,
      reason: refund.reason,
      createdAt: refund.createdAt.toISOString(),
      completedAt: refund.completedAt?.toISOString() ?? null,
    })),
  };
}
