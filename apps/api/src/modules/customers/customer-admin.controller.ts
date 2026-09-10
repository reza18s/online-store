import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { AdminCustomerPage, ApiEnvelope } from '@nova/api-client';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import {
  RequireStaffRoles,
  StaffAuthGuard,
  StaffRoleGuard,
  type StaffRequest,
} from '../staff-auth/staff-auth.guard';
import { AdminCustomerListQueryDto } from './dto/admin-customer-list.query';
import {
  CustomerAdminService,
  type AdminCustomerPageView,
  type AdminCustomerView,
} from './customer-admin.service';

@Controller('admin/customers')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
@RequireStaffRoles('support', 'operations', 'admin')
export class CustomerAdminController {
  public constructor(private readonly customers: CustomerAdminService) {}

  @Get()
  public async list(
    @Query() query: AdminCustomerListQueryDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCustomerPage>> {
    return this.envelope(request, toAdminCustomerPage(await this.customers.listForStaff(this.staff(request), query)));
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

function toAdminCustomerPage(source: AdminCustomerPageView): AdminCustomerPage {
  return {
    items: source.items.map(toAdminCustomer),
    total: source.total,
    page: source.page,
    limit: source.limit,
  };
}

function toAdminCustomer(source: AdminCustomerView) {
  return {
    id: source.id,
    phone: source.phone,
    email: source.email,
    status: source.status,
    orderCount: source.orderCount,
    lastOrderNumber: source.lastOrderNumber,
    lastOrderStatus: source.lastOrderStatus,
    lastOrderAt: source.lastOrderAt?.toISOString() ?? null,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}
