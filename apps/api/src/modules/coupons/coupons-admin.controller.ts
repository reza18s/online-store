import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AdminCoupon, AdminCouponPage, ApiEnvelope } from '@nova/api-client';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import {
  RequireStaffRoles,
  StaffAuthGuard,
  StaffRoleGuard,
  type StaffRequest,
} from '../staff-auth/staff-auth.guard';
import { CreateAdminCouponDto, UpdateAdminCouponDto } from './dto/admin-coupon.dto';
import { AdminCouponListQueryDto } from './dto/admin-coupon.query';
import {
  CouponService,
  type AdminCouponPage as AdminCouponPageView,
  type AdminCouponView,
} from './coupon.service';

@Controller('admin/coupons')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
@RequireStaffRoles('admin')
export class CouponsAdminController {
  public constructor(private readonly coupons: CouponService) {}

  @Get()
  @RequireStaffRoles('support', 'operations', 'admin')
  public async list(
    @Query() query: AdminCouponListQueryDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCouponPage>> {
    return this.envelope(request, toAdminCouponPage(await this.coupons.listForStaff(this.staff(request), query)));
  }

  @Post()
  public async create(
    @Body() body: CreateAdminCouponDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCoupon>> {
    return this.envelope(
      request,
      toAdminCoupon(await this.coupons.createForStaff(this.staff(request), body)),
    );
  }

  @Patch(':couponId')
  public async update(
    @Param('couponId') couponId: string,
    @Body() body: UpdateAdminCouponDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCoupon>> {
    return this.envelope(
      request,
      toAdminCoupon(await this.coupons.updateForStaff(this.staff(request), couponId, body)),
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

function toAdminCouponPage(source: AdminCouponPageView): AdminCouponPage {
  return {
    items: source.items.map(toAdminCoupon),
    total: source.total,
    page: source.page,
    limit: source.limit,
  };
}

function toAdminCoupon(source: AdminCouponView): AdminCoupon {
  return {
    id: source.id,
    code: source.code,
    type: source.type,
    amount: source.amount,
    minimumOrderToman: source.minimumOrderToman,
    activeFrom: source.activeFrom.toISOString(),
    activeUntil: source.activeUntil.toISOString(),
    maxRedemptions: source.maxRedemptions,
    perUserLimit: source.perUserLimit,
    status: source.status,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}
