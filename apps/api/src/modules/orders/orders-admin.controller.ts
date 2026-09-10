import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import type {
  AdminOrderDetail,
  AdminOrderPage,
  AdminOrderSummary,
  ApiEnvelope,
} from '@nova/api-client';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import {
  RequireStaffRoles,
  StaffAuthGuard,
  StaffRoleGuard,
  type StaffRequest,
} from '../staff-auth/staff-auth.guard';
import { AdminOrderListQueryDto } from './dto/admin-order-list.query';
import { AdminReturnReviewDto } from './dto/admin-return-review.dto';
import { AdminOrderStatusDto } from './dto/admin-order-status.dto';
import { AdminShipmentUpdateDto } from './dto/admin-shipment.dto';
import {
  OrdersService,
  type AdminOrderDetailView,
  type AdminOrderPageView,
  type AdminOrderSummaryView,
} from './orders.service';

@Controller('admin/orders')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
@RequireStaffRoles('support', 'operations', 'admin')
export class OrdersAdminController {
  public constructor(private readonly orders: OrdersService) {}

  @Get()
  public async list(
    @Query() query: AdminOrderListQueryDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminOrderPage>> {
    return this.envelope(
      request,
      toAdminOrderPage(await this.orders.listForStaff(this.staff(request), query)),
    );
  }

  @Get(':orderNumber')
  public async detail(
    @Param('orderNumber') orderNumber: string,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminOrderDetail>> {
    return this.envelope(
      request,
      toAdminOrderDetail(await this.orders.getForStaff(this.staff(request), orderNumber)),
    );
  }

  @Patch(':orderNumber/status')
  @RequireStaffRoles('operations', 'admin')
  public async updateStatus(
    @Param('orderNumber') orderNumber: string,
    @Body() input: AdminOrderStatusDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminOrderDetail>> {
    return this.envelope(
      request,
      toAdminOrderDetail(
        await this.orders.updateFulfillmentStatus(this.staff(request), orderNumber, input),
      ),
    );
  }

  @Patch(':orderNumber/shipment')
  @RequireStaffRoles('operations', 'admin')
  public async updateShipment(
    @Param('orderNumber') orderNumber: string,
    @Body() input: AdminShipmentUpdateDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminOrderDetail>> {
    return this.envelope(
      request,
      toAdminOrderDetail(await this.orders.updateShipment(this.staff(request), orderNumber, input)),
    );
  }

  @Patch(':orderNumber/return')
  @RequireStaffRoles('support', 'admin')
  public async reviewReturn(
    @Param('orderNumber') orderNumber: string,
    @Body() input: AdminReturnReviewDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminOrderDetail>> {
    return this.envelope(
      request,
      toAdminOrderDetail(
        await this.orders.reviewReturnForStaff(this.staff(request), orderNumber, input),
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

function toAdminOrderPage(source: AdminOrderPageView): AdminOrderPage {
  return {
    items: source.items.map(toAdminOrderSummary),
    total: source.total,
    page: source.page,
    limit: source.limit,
  };
}

function toAdminOrderSummary(source: AdminOrderSummaryView): AdminOrderSummary {
  return {
    orderId: source.orderId,
    orderNumber: source.orderNumber,
    status: source.status,
    paymentStatus: source.paymentStatus,
    subtotalToman: source.subtotalToman,
    discountToman: source.discountToman,
    shippingToman: source.shippingToman,
    taxToman: source.taxToman,
    totalToman: source.totalToman,
    currency: source.currency,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
    customer: source.customer,
    shipmentStatus: source.shipmentStatus,
    trackingReference: source.trackingReference,
  };
}

function toAdminOrderDetail(source: AdminOrderDetailView): AdminOrderDetail {
  return {
    ...toCustomerOrderSummary(source),
    customer: source.customer,
    items: source.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      sku: item.sku,
      variantSnapshot: item.variantSnapshot,
      quantity: item.quantity,
      unitPriceToman: item.unitPriceToman,
      compareAtPriceToman: item.compareAtPriceToman,
      discountToman: item.discountToman,
      taxToman: item.taxToman,
      totalToman: item.totalToman,
    })),
    address: source.address
      ? {
          recipientName: source.address.recipientName,
          phone: source.address.phone,
          province: source.address.province,
          city: source.address.city,
          addressLine: source.address.addressLine,
          postalCode: source.address.postalCode,
        }
      : null,
    payment: source.payment
      ? {
          status: source.payment.status,
          amountToman: source.payment.amountToman,
          redirectUrl: source.payment.redirectUrl,
          createdAt: source.payment.createdAt.toISOString(),
          paidAt: source.payment.paidAt?.toISOString() ?? null,
        }
      : null,
    shipment: source.shipment
      ? {
          provider: source.shipment.provider,
          method: source.shipment.method,
          trackingReference: source.shipment.trackingReference,
          status: source.shipment.status,
          shippedAt: source.shipment.shippedAt?.toISOString() ?? null,
          deliveredAt: source.shipment.deliveredAt?.toISOString() ?? null,
        }
      : null,
    events: source.events.map((event) => ({
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      createdAt: event.createdAt.toISOString(),
    })),
    refunds: source.refunds.map((refund) => ({
      id: refund.id,
      amountToman: refund.amountToman,
      status: refund.status,
      reason: refund.reason,
      createdAt: refund.createdAt.toISOString(),
      completedAt: refund.completedAt?.toISOString() ?? null,
    })),
    returnRequest: source.returnRequest
      ? {
          id: source.returnRequest.id,
          reason: source.returnRequest.reason,
          note: source.returnRequest.note,
          status: source.returnRequest.status,
          requestedAt: source.returnRequest.requestedAt.toISOString(),
          reviewedAt: source.returnRequest.reviewedAt?.toISOString() ?? null,
          receivedAt: source.returnRequest.receivedAt?.toISOString() ?? null,
          items: source.returnRequest.items.map((item) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
          })),
        }
      : null,
  };
}

function toCustomerOrderSummary(
  source: AdminOrderDetailView,
): Omit<
  AdminOrderDetail,
  'customer' | 'items' | 'address' | 'payment' | 'shipment' | 'events' | 'refunds' | 'returnRequest'
> {
  return {
    orderId: source.orderId,
    orderNumber: source.orderNumber,
    status: source.status,
    paymentStatus: source.paymentStatus,
    subtotalToman: source.subtotalToman,
    discountToman: source.discountToman,
    shippingToman: source.shippingToman,
    taxToman: source.taxToman,
    totalToman: source.totalToman,
    currency: source.currency,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}
