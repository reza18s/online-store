import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { ApiEnvelope } from '@nova/api-client';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import {
  RequireStaffRoles,
  StaffAuthGuard,
  StaffRoleGuard,
  type StaffRequest,
} from '../staff-auth/staff-auth.guard';
import {
  DashboardService,
  type DashboardSummaryQuery,
  type DashboardSummaryView,
} from './dashboard.service';

@Controller('admin/dashboard')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
@RequireStaffRoles('admin')
export class DashboardController {
  public constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  public async summary(
    @Query() query: DashboardSummaryQuery,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<DashboardSummaryView>> {
    return this.envelope(request, await this.dashboard.getSummary(this.staff(request), query));
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
