import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AdminInventoryItem, AdminInventoryPage, ApiEnvelope } from '@nova/api-client';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import {
  RequireStaffRoles,
  StaffAuthGuard,
  StaffRoleGuard,
  type StaffRequest,
} from '../staff-auth/staff-auth.guard';
import {
  AdminInventoryAdjustmentDto,
  AdminInventoryReorderPointDto,
} from './dto/admin-inventory.dto';
import { AdminInventoryListQueryDto } from './dto/admin-inventory.query';
import {
  InventoryAdminService,
  type AdminInventoryItemView,
  type AdminInventoryMovementView,
} from './inventory-admin.service';

@Controller('admin/inventory')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
@RequireStaffRoles('operations', 'admin')
export class InventoryAdminController {
  public constructor(private readonly inventory: InventoryAdminService) {}

  @Get('items')
  @RequireStaffRoles('support', 'operations', 'admin')
  public async list(
    @Query() query: AdminInventoryListQueryDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminInventoryPage>> {
    return this.envelope(
      request,
      toAdminInventoryPage(await this.inventory.listInventory(this.staff(request), query)),
    );
  }

  @Get('items/:variantId')
  @RequireStaffRoles('support', 'operations', 'admin')
  public async detail(
    @Param('variantId') variantId: string,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminInventoryItem>> {
    return this.envelope(
      request,
      toAdminInventoryItem(await this.inventory.getInventory(this.staff(request), variantId)),
    );
  }

  @Post('items/:variantId/adjustments')
  public async adjust(
    @Param('variantId') variantId: string,
    @Body() body: AdminInventoryAdjustmentDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminInventoryItem>> {
    return this.envelope(
      request,
      toAdminInventoryItem(
        await this.inventory.adjustInventory(this.staff(request), variantId, body),
      ),
    );
  }

  @Patch('items/:variantId/reorder-point')
  public async reorderPoint(
    @Param('variantId') variantId: string,
    @Body() body: AdminInventoryReorderPointDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminInventoryItem>> {
    return this.envelope(
      request,
      toAdminInventoryItem(
        await this.inventory.updateReorderPoint(this.staff(request), variantId, body),
      ),
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

function toAdminInventoryPage(source: {
  items: AdminInventoryItemView[];
  total: number;
  page: number;
  limit: number;
}): AdminInventoryPage {
  return {
    items: source.items.map(toAdminInventoryItem),
    total: source.total,
    page: source.page,
    limit: source.limit,
  };
}

function toAdminInventoryItem(source: AdminInventoryItemView): AdminInventoryItem {
  return {
    id: source.id,
    variantId: source.variantId,
    productId: source.productId,
    productSlug: source.productSlug,
    productName: source.productName,
    productStatus: source.productStatus,
    sku: source.sku,
    variantTitle: source.variantTitle,
    isActive: source.isActive,
    onHand: source.onHand,
    reserved: source.reserved,
    available: source.available,
    reorderPoint: source.reorderPoint,
    stockStatus: source.stockStatus,
    updatedAt: source.updatedAt.toISOString(),
    ...(source.recentMovements
      ? { recentMovements: source.recentMovements.map(toAdminInventoryMovement) }
      : {}),
  };
}

function toAdminInventoryMovement(source: AdminInventoryMovementView) {
  return {
    id: source.id,
    type: source.type,
    quantity: source.quantity,
    reference: source.reference,
    createdAt: source.createdAt.toISOString(),
  };
}
