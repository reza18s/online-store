import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type {
  ApiEnvelope,
  CustomerOrderDetail,
  CustomerOrderPage,
  CustomerOrderSummary,
} from '@nova/api-client';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import { CustomerAuthGuard, type CustomerRequest } from '../auth/customer-auth.guard';
import { CustomerOrderCancelDto } from './dto/customer-order-cancel.dto';
import { CustomerReturnRequestDto } from './dto/customer-return-request.dto';
import { CustomerOrderListQueryDto } from './dto/order-list.query';
import {
  OrdersService,
  type CustomerOrderDetailView,
  type CustomerOrderPageView,
  type CustomerOrderSummaryView,
} from './orders.service';

@Controller('account/orders')
@UseGuards(CustomerAuthGuard)
export class OrdersController {
  public constructor(private readonly orders: OrdersService) {}

  @Get()
  public async list(
    @Query() query: CustomerOrderListQueryDto,
    @Req() request: CustomerRequest,
  ): Promise<ApiEnvelope<CustomerOrderPage>> {
    return this.envelope(
      request,
      toCustomerOrderPage(await this.orders.listForCustomer(this.customerId(request), query)),
    );
  }

  @Get(':orderNumber')
  public async detail(
    @Param('orderNumber') orderNumber: string,
    @Req() request: CustomerRequest,
  ): Promise<ApiEnvelope<CustomerOrderDetail>> {
    return this.envelope(
      request,
      toCustomerOrderDetail(
        await this.orders.getForCustomer(this.customerId(request), orderNumber),
      ),
    );
  }

  @Post(':orderNumber/cancel')
  public async cancel(
    @Param('orderNumber') orderNumber: string,
    @Body() input: CustomerOrderCancelDto,
    @Req() request: CustomerRequest,
  ): Promise<ApiEnvelope<CustomerOrderDetail>> {
    return this.envelope(
      request,
      toCustomerOrderDetail(
        await this.orders.cancelForCustomer(this.customerId(request), orderNumber, input),
      ),
    );
  }

  @Post(':orderNumber/returns')
  public async requestReturn(
    @Param('orderNumber') orderNumber: string,
    @Body() input: CustomerReturnRequestDto,
    @Req() request: CustomerRequest,
  ): Promise<ApiEnvelope<CustomerOrderDetail>> {
    return this.envelope(
      request,
      toCustomerOrderDetail(
        await this.orders.requestReturnForCustomer(this.customerId(request), orderNumber, input),
      ),
    );
  }

  private customerId(request: CustomerRequest): string {
    if (!request.customer) throw new Error('CustomerAuthGuard did not attach a customer.');
    return request.customer.id;
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

function toCustomerOrderPage(source: CustomerOrderPageView): CustomerOrderPage {
  return {
    items: source.items.map(toCustomerOrderSummary),
    total: source.total,
    page: source.page,
    limit: source.limit,
  };
}

function toCustomerOrderSummary(source: CustomerOrderSummaryView): CustomerOrderSummary {
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

function toCustomerOrderDetail(source: CustomerOrderDetailView): CustomerOrderDetail {
  return {
    ...toCustomerOrderSummary(source),
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
