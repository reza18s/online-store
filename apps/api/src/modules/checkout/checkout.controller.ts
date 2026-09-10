import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import type {
  ApiEnvelope,
  CheckoutOrder,
  CheckoutQuote as CheckoutQuoteResponse,
} from '@nova/api-client';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import { CustomerAuthGuard, type CustomerRequest } from '../auth/customer-auth.guard';
import { CheckoutService, type CheckoutQuote, type CheckoutResult } from './checkout.service';
import { CheckoutRequestDto } from './dto/checkout.dto';

@Controller('checkout')
@UseGuards(CustomerAuthGuard)
export class CheckoutController {
  public constructor(private readonly checkout: CheckoutService) {}

  @Post('quote')
  public async quote(
    @Req() request: CustomerRequest,
    @Body() body: CheckoutRequestDto,
  ): Promise<ApiEnvelope<CheckoutQuoteResponse>> {
    return this.envelope(
      request,
      toCheckoutQuoteResponse(
        await this.checkout.quote({
          userId: this.userId(request),
          addressId: body.addressId,
          shippingMethod: body.shippingMethod,
          couponCode: body.couponCode,
        }),
      ),
    );
  }

  @Post()
  public async submit(
    @Req() request: CustomerRequest,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: CheckoutRequestDto,
  ): Promise<ApiEnvelope<CheckoutOrder>> {
    return this.envelope(
      request,
      toCheckoutOrderResponse(
        await this.checkout.submit({
          userId: this.userId(request),
          addressId: body.addressId,
          shippingMethod: body.shippingMethod,
          couponCode: body.couponCode,
          idempotencyKey: idempotencyKey ?? '',
        }),
      ),
    );
  }

  private userId(request: CustomerRequest): string {
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

function toCheckoutQuoteResponse(source: CheckoutQuote): CheckoutQuoteResponse {
  return {
    cartId: source.cartId,
    address: {
      id: source.address.id,
      label: source.address.label,
      recipientName: source.address.recipientName,
      phone: source.address.phone,
      province: source.address.province,
      city: source.address.city,
      addressLine: source.address.addressLine,
      postalCode: source.address.postalCode,
      isDefault: source.address.isDefault,
      createdAt: source.address.createdAt.toISOString(),
      updatedAt: source.address.updatedAt.toISOString(),
    },
    shippingMethod: source.shippingMethod,
    shippingLabel: source.shippingLabel,
    shippingEstimate: source.shippingEstimate,
    lines: source.lines.map((line) => ({
      cartItemId: line.cartItemId,
      productId: line.productId,
      variantId: line.variantId,
      productName: line.productName,
      sku: line.sku,
      selectedOptions: line.selectedOptions,
      quantity: line.quantity,
      unitPriceToman: line.unitPriceToman,
      compareAtPriceToman: line.compareAtPriceToman,
      lineTotalToman: line.lineTotalToman,
    })),
    subtotalToman: source.subtotalToman,
    discountToman: source.discountToman,
    coupon: source.coupon
      ? {
          couponId: source.coupon.couponId,
          code: source.coupon.code,
          type: source.coupon.type,
          amount: source.coupon.amount,
          minimumOrderToman: source.coupon.minimumOrderToman,
          discountToman: source.coupon.discountToman,
        }
      : null,
    shippingToman: source.shippingToman,
    taxToman: source.taxToman,
    totalToman: source.totalToman,
    currency: source.currency,
    expiresAt: source.expiresAt.toISOString(),
  };
}

function toCheckoutOrderResponse(source: CheckoutResult): CheckoutOrder {
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
    payment: source.payment,
  };
}
