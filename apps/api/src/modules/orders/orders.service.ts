import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@nova/db';
import type {
  OrderStatus,
  PaymentAttemptStatus,
  PaymentStatus,
  RefundStatus,
  ReturnReason,
  ReturnRequestStatus,
  ShipmentStatus,
  UserStatus,
} from '@nova/db';

import { DatabaseService } from '../../database/database.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { CouponService } from '../coupons/coupon.service';
import { InventoryService } from '../inventory/inventory.service';
import { PaymentService } from '../payments/payment.service';
import { assertStaffRole } from '../staff-auth/staff-auth.guard';
import {
  ADMIN_ORDER_STATUSES,
  ADMIN_PAYMENT_STATUSES,
  AdminOrderListQueryDto,
} from './dto/admin-order-list.query';
import {
  AdminOrderStatusDto,
} from './dto/admin-order-status.dto';
import { AdminShipmentUpdateDto } from './dto/admin-shipment.dto';
import { AdminReturnReviewDto } from './dto/admin-return-review.dto';
import { CustomerOrderCancelDto } from './dto/customer-order-cancel.dto';
import {
  CUSTOMER_RETURN_REASONS,
  CustomerReturnRequestDto,
} from './dto/customer-return-request.dto';
import { CUSTOMER_ORDER_STATUSES, CustomerOrderListQueryDto } from './dto/order-list.query';

const CUSTOMER_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const ORDER_NUMBER_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

const orderSummarySelect = {
  id: true,
  orderNumber: true,
  status: true,
  paymentStatus: true,
  subtotalToman: true,
  discountToman: true,
  shippingToman: true,
  taxToman: true,
  totalToman: true,
  moneyUnit: true,
  createdAt: true,
  updatedAt: true,
} as const;

const orderDetailSelect = {
  ...orderSummarySelect,
  items: {
    orderBy: [{ id: 'asc' }],
    select: {
      id: true,
      productId: true,
      variantId: true,
      productNameSnapshot: true,
      skuSnapshot: true,
      variantSnapshot: true,
      quantity: true,
      unitPriceToman: true,
      compareAtPriceToman: true,
      discountToman: true,
      taxToman: true,
      totalToman: true,
    },
  },
  addressSnapshot: {
    select: {
      recipientName: true,
      phone: true,
      province: true,
      city: true,
      addressLine: true,
      postalCode: true,
    },
  },
  paymentAttempts: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: {
      status: true,
      amountToman: true,
      redirectUrl: true,
      createdAt: true,
      paidAt: true,
    },
  },
  shipment: {
    select: {
      provider: true,
      method: true,
      trackingReference: true,
      status: true,
      shippedAt: true,
      deliveredAt: true,
    },
  },
  events: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      fromStatus: true,
      toStatus: true,
      createdAt: true,
    },
  },
  refunds: {
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      amountToman: true,
      status: true,
      reason: true,
      createdAt: true,
      completedAt: true,
    },
  },
  returnRequest: {
    select: {
      id: true,
      reason: true,
      note: true,
      status: true,
      requestedAt: true,
      reviewedAt: true,
      receivedAt: true,
      items: {
        orderBy: [{ id: 'asc' }],
        select: { orderItemId: true, quantity: true },
      },
    },
  },
} satisfies Prisma.OrderSelect;

const adminOrderSummarySelect = {
  ...orderSummarySelect,
  user: {
    select: {
      id: true,
      phone: true,
      email: true,
      status: true,
    },
  },
  shipment: {
    select: {
      status: true,
      trackingReference: true,
    },
  },
} satisfies Prisma.OrderSelect;

const adminOrderDetailSelect = {
  ...orderDetailSelect,
  user: {
    select: {
      id: true,
      phone: true,
      email: true,
      status: true,
    },
  },
} satisfies Prisma.OrderSelect;

interface OrderSummarySource {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalToman: number;
  discountToman: number;
  shippingToman: number;
  taxToman: number;
  totalToman: number;
  moneyUnit: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderDetailSource extends OrderSummarySource {
  items: Array<{
    id: string;
    productId: string | null;
    variantId: string | null;
    productNameSnapshot: string;
    skuSnapshot: string;
    variantSnapshot: Prisma.JsonValue | null;
    quantity: number;
    unitPriceToman: number;
    compareAtPriceToman: number | null;
    discountToman: number;
    taxToman: number;
    totalToman: number;
  }>;
  addressSnapshot: {
    recipientName: string;
    phone: string;
    province: string;
    city: string;
    addressLine: string;
    postalCode: string;
  } | null;
  paymentAttempts: Array<{
    status: PaymentAttemptStatus;
    amountToman: number;
    redirectUrl: string | null;
    createdAt: Date;
    paidAt: Date | null;
  }>;
  shipment: {
    provider: string;
    method: string;
    trackingReference: string | null;
    status: ShipmentStatus;
    shippedAt: Date | null;
    deliveredAt: Date | null;
  } | null;
  events: Array<{
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus | null;
    createdAt: Date;
  }>;
  refunds: Array<{
    id: string;
    amountToman: number;
    status: RefundStatus;
    reason: string | null;
    createdAt: Date;
    completedAt: Date | null;
  }>;
  returnRequest: {
    id: string;
    reason: ReturnReason;
    note: string | null;
    status: ReturnRequestStatus;
    requestedAt: Date;
    reviewedAt: Date | null;
    receivedAt: Date | null;
    items: Array<{
      orderItemId: string;
      quantity: number;
    }>;
  } | null;
}

interface OrderCustomerSource {
  id: string;
  phone: string;
  email: string | null;
  status: UserStatus;
}

interface AdminOrderSummarySource extends OrderSummarySource {
  user: OrderCustomerSource | null;
  shipment: { status: ShipmentStatus; trackingReference: string | null } | null;
}

interface AdminOrderDetailSource extends OrderDetailSource {
  user: OrderCustomerSource | null;
}

export interface CustomerOrderSummaryView {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalToman: number;
  discountToman: number;
  shippingToman: number;
  taxToman: number;
  totalToman: number;
  currency: 'TOMAN';
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerOrderItemView {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  sku: string;
  variantSnapshot: Prisma.JsonValue | null;
  quantity: number;
  unitPriceToman: number;
  compareAtPriceToman: number | null;
  discountToman: number;
  taxToman: number;
  totalToman: number;
}

export interface CustomerOrderAddressView {
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
}

export interface CustomerOrderPaymentView {
  status: PaymentAttemptStatus;
  amountToman: number;
  redirectUrl: string | null;
  createdAt: Date;
  paidAt: Date | null;
}

export interface CustomerOrderShipmentView {
  provider: string;
  method: string;
  trackingReference: string | null;
  status: ShipmentStatus;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}

export interface CustomerOrderEventView {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
  createdAt: Date;
}

export interface CustomerOrderRefundView {
  id: string;
  amountToman: number;
  status: RefundStatus;
  reason: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface CustomerReturnItemView {
  orderItemId: string;
  quantity: number;
}

export interface CustomerReturnRequestView {
  id: string;
  reason: ReturnReason;
  note: string | null;
  status: ReturnRequestStatus;
  requestedAt: Date;
  reviewedAt: Date | null;
  receivedAt: Date | null;
  items: CustomerReturnItemView[];
}

export interface CustomerOrderDetailView extends CustomerOrderSummaryView {
  items: CustomerOrderItemView[];
  address: CustomerOrderAddressView | null;
  payment: CustomerOrderPaymentView | null;
  shipment: CustomerOrderShipmentView | null;
  events: CustomerOrderEventView[];
  refunds: CustomerOrderRefundView[];
  returnRequest: CustomerReturnRequestView | null;
}

export interface CustomerOrderPageView {
  items: CustomerOrderSummaryView[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminOrderCustomerView {
  id: string;
  phone: string;
  email: string | null;
  status: UserStatus;
}

export interface AdminOrderSummaryView extends CustomerOrderSummaryView {
  customer: AdminOrderCustomerView | null;
  shipmentStatus: ShipmentStatus | null;
  trackingReference: string | null;
}

export interface AdminOrderDetailView extends CustomerOrderDetailView {
  customer: AdminOrderCustomerView | null;
}

export interface AdminOrderPageView {
  items: AdminOrderSummaryView[];
  total: number;
  page: number;
  limit: number;
}

function assertCustomerId(value: string): void {
  if (!CUSTOMER_ID_PATTERN.test(value)) throw new BadRequestException('شناسه مشتری معتبر نیست.');
}

function assertOrderNumber(value: string): void {
  if (!ORDER_NUMBER_PATTERN.test(value)) throw new BadRequestException('شماره سفارش معتبر نیست.');
}

function pageBounds(query: CustomerOrderListQueryDto): { page: number; limit: number } {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000) {
    throw new BadRequestException('شماره صفحه سفارش معتبر نیست.');
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
    throw new BadRequestException('اندازه صفحه سفارش معتبر نیست.');
  }
  return { page, limit };
}

const ORDER_FULFILLMENT_TRANSITIONS: Partial<Record<OrderStatus, readonly OrderStatus[]>> = {
  CONFIRMED: ['PREPARING'],
  PREPARING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
};

const SHIPMENT_TRANSITIONS: Partial<Record<ShipmentStatus, readonly ShipmentStatus[]>> = {
  PENDING: ['PACKED'],
  PACKED: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
};

function assertReason(reason: string): string {
  const normalized = reason.trim();
  if (!normalized || normalized.length > 500) {
    throw new BadRequestException('دلیل عملیات سفارش معتبر نیست.');
  }
  return normalized;
}

function expectedUpdatedAt(value: string | undefined): Date | undefined {
  if (value === undefined) return undefined;
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new BadRequestException('زمان نسخه سفارش معتبر نیست.');
  }
  return timestamp;
}

function assertOrderFulfillmentTransition(current: OrderStatus, target: OrderStatus): void {
  if (current === target) return;
  if (!ORDER_FULFILLMENT_TRANSITIONS[current]?.includes(target)) {
    throw new ConflictException('انتقال وضعیت سفارش مجاز نیست.');
  }
}

function assertShipmentTransition(current: ShipmentStatus, target: ShipmentStatus): void {
  if (current === target) return;
  if (!SHIPMENT_TRANSITIONS[current]?.includes(target)) {
    throw new ConflictException('انتقال وضعیت ارسال مجاز نیست.');
  }
}

const RETURN_REQUEST_TRANSITIONS: Partial<
  Record<ReturnRequestStatus, readonly ReturnRequestStatus[]>
> = {
  REQUESTED: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['REFUNDED'],
};

const RETURN_WINDOW_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

function assertReturnReason(value: string): ReturnReason {
  if (!CUSTOMER_RETURN_REASONS.includes(value as (typeof CUSTOMER_RETURN_REASONS)[number])) {
    throw new BadRequestException('دلیل مرجوعی معتبر نیست.');
  }
  return value as ReturnReason;
}

function assertReturnTransition(current: ReturnRequestStatus, target: ReturnRequestStatus): void {
  if (current === target) return;
  if (!RETURN_REQUEST_TRANSITIONS[current]?.includes(target)) {
    throw new ConflictException('انتقال وضعیت مرجوعی مجاز نیست.');
  }
}

export function toCustomerOrderSummary(source: OrderSummarySource): CustomerOrderSummaryView {
  if (source.moneyUnit !== 'TOMAN') {
    throw new ConflictException('واحد پول سفارش پشتیبانی نمی‌شود.');
  }
  return {
    orderId: source.id,
    orderNumber: source.orderNumber,
    status: source.status,
    paymentStatus: source.paymentStatus,
    subtotalToman: source.subtotalToman,
    discountToman: source.discountToman,
    shippingToman: source.shippingToman,
    taxToman: source.taxToman,
    totalToman: source.totalToman,
    currency: 'TOMAN',
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

function toOrderDetail(source: OrderDetailSource): CustomerOrderDetailView {
  return {
    ...toCustomerOrderSummary(source),
    items: source.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productNameSnapshot,
      sku: item.skuSnapshot,
      variantSnapshot: item.variantSnapshot,
      quantity: item.quantity,
      unitPriceToman: item.unitPriceToman,
      compareAtPriceToman: item.compareAtPriceToman,
      discountToman: item.discountToman,
      taxToman: item.taxToman,
      totalToman: item.totalToman,
    })),
    address: source.addressSnapshot,
    payment: source.paymentAttempts[0] ?? null,
    shipment: source.shipment,
    events: source.events,
    refunds: source.refunds,
    returnRequest: source.returnRequest,
  };
}

function toAdminCustomer(source: OrderCustomerSource | null): AdminOrderCustomerView | null {
  return source ? { ...source } : null;
}

function toAdminOrderSummary(source: AdminOrderSummarySource): AdminOrderSummaryView {
  return {
    ...toCustomerOrderSummary(source),
    customer: toAdminCustomer(source.user),
    shipmentStatus: source.shipment?.status ?? null,
    trackingReference: source.shipment?.trackingReference ?? null,
  };
}

function toAdminOrderDetail(source: AdminOrderDetailSource): AdminOrderDetailView {
  return {
    ...toOrderDetail(source),
    customer: toAdminCustomer(source.user),
  };
}

@Injectable()
export class OrdersService {
  public constructor(
    private readonly database: DatabaseService,
    @Optional() private readonly audit?: AuditService,
    @Optional() private readonly inventory?: InventoryService,
    @Optional() private readonly payments?: PaymentService,
    @Optional() private readonly coupons?: CouponService,
  ) {}

  public async listForCustomer(
    customerId: string,
    query: CustomerOrderListQueryDto,
  ): Promise<CustomerOrderPageView> {
    assertCustomerId(customerId);
    const { page, limit } = pageBounds(query);
    const where: Prisma.OrderWhereInput = {
      userId: customerId,
      ...(query.status && CUSTOMER_ORDER_STATUSES.includes(query.status)
        ? { status: query.status }
        : {}),
    };
    const [total, orders] = await Promise.all([
      this.database.prisma.order.count({ where }),
      this.database.prisma.order.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: orderSummarySelect,
      }),
    ]);

    return {
      items: orders.map(toCustomerOrderSummary),
      total,
      page,
      limit,
    };
  }

  public async getForCustomer(
    customerId: string,
    orderNumber: string,
  ): Promise<CustomerOrderDetailView> {
    assertCustomerId(customerId);
    assertOrderNumber(orderNumber);
    const order = await this.database.prisma.order.findFirst({
      where: { userId: customerId, orderNumber },
      select: orderDetailSelect,
    });
    if (!order) throw new NotFoundException('سفارش پیدا نشد.');
    return toOrderDetail(order);
  }

  public async cancelForCustomer(
    customerId: string,
    orderNumber: string,
    input: CustomerOrderCancelDto,
  ): Promise<CustomerOrderDetailView> {
    assertCustomerId(customerId);
    assertOrderNumber(orderNumber);
    const reason = assertReason(input.reason);
    if (!this.inventory || !this.payments) {
      throw new ServiceUnavailableException('عملیات سفارش هنوز پیکربندی نشده است.');
    }

    const cancellation = await this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.order.findFirst({
        where: { userId: customerId, orderNumber },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          totalToman: true,
          updatedAt: true,
          paymentAttempts: {
            orderBy: [{ createdAt: 'desc' }],
            take: 1,
            select: {
              id: true,
              provider: true,
              providerTransactionId: true,
              status: true,
              amountToman: true,
            },
          },
        },
      });
      if (!current) throw new NotFoundException('سفارش پیدا نشد.');

      const attempt = current.paymentAttempts[0] ?? null;
      if (current.status === 'CANCELLED' && current.paymentStatus === 'FAILED') {
        return { kind: 'UNPAID' as const, orderId: current.id };
      }
      if (current.status === 'CANCELLED') {
        const cancellationRefund = await transaction.refund.findUnique({
          where: { idempotencyKey: `customer-cancel:${current.id}` },
          select: { id: true },
        });
        if (!cancellationRefund || !['PAID', 'REFUNDED'].includes(current.paymentStatus)) {
          throw new ConflictException('این سفارش دیگر قابل لغو نیست.');
        }
        if (!attempt || attempt.status !== 'SUCCEEDED') {
          throw new ConflictException('تلاش پرداخت سفارش قابل بازپرداخت نیست.');
        }
        if (attempt.amountToman !== current.totalToman) {
          throw new ConflictException('مبلغ سفارش با تلاش پرداخت هم‌خوان نیست.');
        }
        return {
          kind: 'PAID' as const,
          orderId: current.id,
          orderNumber: current.orderNumber,
          paymentAttemptId: attempt.id,
          provider: attempt.provider,
          providerTransactionId: attempt.providerTransactionId ?? undefined,
          amountToman: current.totalToman,
        };
      }
      if (current.status === 'PENDING_PAYMENT') {
        const updated = await transaction.order.updateMany({
          where: {
            id: current.id,
            status: 'PENDING_PAYMENT',
            paymentStatus: 'PENDING',
            updatedAt: current.updatedAt,
          },
          data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
        });
        if (updated.count !== 1) {
          throw new ConflictException('سفارش هم‌زمان تغییر کرده است.');
        }
        if (attempt) {
          await transaction.paymentAttempt.updateMany({
            where: { id: attempt.id, status: { in: ['PENDING', 'REDIRECTED'] } },
            data: { status: 'CANCELLED' },
          });
        }
        await transaction.orderEvent.create({
          data: {
            orderId: current.id,
            actorType: 'CUSTOMER',
            actorId: customerId,
            fromStatus: 'PENDING_PAYMENT',
            toStatus: 'CANCELLED',
            reason,
          },
        });
        await this.audit?.record(
          {
            actorType: 'CUSTOMER',
            actorUserId: customerId,
            action: 'order.cancelled',
            resourceType: 'Order',
            resourceId: current.id,
            metadata: { reason, paymentStatus: 'PENDING' },
          },
          transaction,
        );
        await this.coupons?.releaseForOrder(current.id, transaction);
        return { kind: 'UNPAID' as const, orderId: current.id };
      }

      if (current.status !== 'CONFIRMED' || current.paymentStatus !== 'PAID') {
        throw new ConflictException('این سفارش دیگر قابل لغو نیست.');
      }
      if (!attempt || attempt.status !== 'SUCCEEDED') {
        throw new ConflictException('تلاش پرداخت سفارش قابل بازپرداخت نیست.');
      }
      if (attempt.amountToman !== current.totalToman) {
        throw new ConflictException('مبلغ سفارش با تلاش پرداخت هم‌خوان نیست.');
      }

      const updated = await transaction.order.updateMany({
        where: {
          id: current.id,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          updatedAt: current.updatedAt,
        },
        data: { status: 'CANCELLED' },
      });
      if (updated.count !== 1) {
        throw new ConflictException('سفارش هم‌زمان تغییر کرده است.');
      }
      await transaction.orderEvent.create({
        data: {
          orderId: current.id,
          actorType: 'CUSTOMER',
          actorId: customerId,
          fromStatus: 'CONFIRMED',
          toStatus: 'CANCELLED',
          reason,
        },
      });
      await this.audit?.record(
        {
          actorType: 'CUSTOMER',
          actorUserId: customerId,
          action: 'order.cancelled',
          resourceType: 'Order',
          resourceId: current.id,
          metadata: { reason, paymentStatus: 'PAID' },
        },
        transaction,
      );
      return {
        kind: 'PAID' as const,
        orderId: current.id,
        orderNumber: current.orderNumber,
        paymentAttemptId: attempt.id,
        provider: attempt.provider,
        providerTransactionId: attempt.providerTransactionId ?? undefined,
        amountToman: current.totalToman,
      };
    });

    if (cancellation.kind === 'UNPAID') {
      await this.inventory.releaseForOrder(cancellation.orderId);
      return this.getForCustomer(customerId, orderNumber);
    }

    await this.payments.processRefund({
      orderId: cancellation.orderId,
      orderNumber: cancellation.orderNumber,
      paymentAttemptId: cancellation.paymentAttemptId,
      provider: cancellation.provider,
      providerTransactionId: cancellation.providerTransactionId,
      amountToman: cancellation.amountToman,
      idempotencyKey: `customer-cancel:${cancellation.orderId}`,
      reason,
    });
    return this.getForCustomer(customerId, orderNumber);
  }

  public async requestReturnForCustomer(
    customerId: string,
    orderNumber: string,
    input: CustomerReturnRequestDto,
  ): Promise<CustomerOrderDetailView> {
    assertCustomerId(customerId);
    assertOrderNumber(orderNumber);
    const reason = assertReturnReason(input.reason);
    if (!input.unusedConfirmed || !input.unwashedConfirmed || !input.tagsAttachedConfirmed) {
      throw new BadRequestException('شرایط استفاده از مرجوعی تأیید نشده است.');
    }
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new BadRequestException('حداقل یک قلم برای مرجوعی لازم است.');
    }
    const note = input.note?.trim() || null;
    const requestedItems = input.items.map((item) => ({
      orderItemId: item.orderItemId.trim(),
      quantity: item.quantity,
    }));
    const itemIdPattern = /^[A-Za-z0-9_-]{1,128}$/;
    const seen = new Set<string>();
    for (const item of requestedItems) {
      if (!itemIdPattern.test(item.orderItemId)) {
        throw new BadRequestException('شناسه قلم مرجوعی معتبر نیست.');
      }
      if (seen.has(item.orderItemId)) {
        throw new BadRequestException('یک قلم مرجوعی بیش از یک بار ارسال شده است.');
      }
      seen.add(item.orderItemId);
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
        throw new BadRequestException('تعداد قلم مرجوعی معتبر نیست.');
      }
    }

    await this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.order.findFirst({
        where: { userId: customerId, orderNumber },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          shipment: { select: { status: true, deliveredAt: true } },
          returnRequest: { select: { id: true } },
          items: { select: { id: true, quantity: true } },
        },
      });
      if (!current) throw new NotFoundException('سفارش پیدا نشد.');
      if (
        current.status !== 'DELIVERED' ||
        current.paymentStatus !== 'PAID' ||
        current.shipment?.status !== 'DELIVERED' ||
        !current.shipment.deliveredAt
      ) {
        throw new ConflictException('این سفارش در بازه مجاز مرجوعی نیست.');
      }
      const now = new Date();
      const age = now.getTime() - current.shipment.deliveredAt.getTime();
      if (age < 0 || age > RETURN_WINDOW_MILLISECONDS) {
        throw new ConflictException('مهلت هفت‌روزه مرجوعی این سفارش تمام شده است.');
      }
      if (current.returnRequest) {
        throw new ConflictException('برای این سفارش قبلاً درخواست مرجوعی ثبت شده است.');
      }

      const orderItems = new Map(current.items.map((item) => [item.id, item.quantity]));
      for (const item of requestedItems) {
        const orderQuantity = orderItems.get(item.orderItemId);
        if (orderQuantity === undefined) {
          throw new BadRequestException('قلم مرجوعی متعلق به این سفارش نیست.');
        }
        if (item.quantity !== orderQuantity) {
          throw new ConflictException('مرجوعی بخشی از یک قلم در این نسخه پشتیبانی نمی‌شود.');
        }
      }

      const created = await transaction.returnRequest.create({
        data: {
          orderId: current.id,
          userId: customerId,
          reason,
          note,
          items: { create: requestedItems },
        },
        select: { id: true },
      });
      await this.audit?.record(
        {
          actorType: 'CUSTOMER',
          actorUserId: customerId,
          action: 'return.requested',
          resourceType: 'ReturnRequest',
          resourceId: created.id,
          metadata: { orderNumber, reason, itemCount: requestedItems.length },
        },
        transaction,
      );
    });

    return this.getForCustomer(customerId, orderNumber);
  }

  public async listForStaff(
    staff: AuthenticatedStaff,
    query: AdminOrderListQueryDto,
  ): Promise<AdminOrderPageView> {
    assertStaffRole(staff, 'support', 'operations', 'admin');
    const page = query.page ?? 1;
    const limit = query.limit ?? 24;
    if (!Number.isSafeInteger(page) || page < 1 || page > 100_000) {
      throw new BadRequestException('شماره صفحه سفارش معتبر نیست.');
    }
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('اندازه صفحه سفارش معتبر نیست.');
    }

    const where: Prisma.OrderWhereInput = {
      ...(query.status && ADMIN_ORDER_STATUSES.includes(query.status)
        ? { status: query.status }
        : {}),
      ...(query.paymentStatus && ADMIN_PAYMENT_STATUSES.includes(query.paymentStatus)
        ? { paymentStatus: query.paymentStatus }
        : {}),
      ...(query.q
        ? {
            OR: [
              { orderNumber: { contains: query.q, mode: 'insensitive' } },
              { user: { phone: { contains: query.q, mode: 'insensitive' } } },
              { user: { email: { contains: query.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [total, orders] = await Promise.all([
      this.database.prisma.order.count({ where }),
      this.database.prisma.order.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: adminOrderSummarySelect,
      }),
    ]);
    return { items: orders.map(toAdminOrderSummary), total, page, limit };
  }

  public async getForStaff(
    staff: AuthenticatedStaff,
    orderNumber: string,
  ): Promise<AdminOrderDetailView> {
    assertStaffRole(staff, 'support', 'operations', 'admin');
    assertOrderNumber(orderNumber);
    const order = await this.database.prisma.order.findUnique({
      where: { orderNumber },
      select: adminOrderDetailSelect,
    });
    if (!order) throw new NotFoundException('سفارش پیدا نشد.');
    return toAdminOrderDetail(order);
  }

  public async reviewReturnForStaff(
    staff: AuthenticatedStaff,
    orderNumber: string,
    input: AdminReturnReviewDto,
  ): Promise<AdminOrderDetailView> {
    assertStaffRole(staff, 'support', 'admin');
    assertOrderNumber(orderNumber);
    const reason = assertReason(input.reason);
    const expected = expectedUpdatedAt(input.expectedUpdatedAt);
    const target = input.status as ReturnRequestStatus;
    if (target === 'RECEIVED' && !this.payments) {
      throw new ServiceUnavailableException('عملیات بازپرداخت هنوز پیکربندی نشده است.');
    }

    const review = await this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.order.findUnique({
        where: { orderNumber },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          totalToman: true,
          updatedAt: true,
          paymentAttempts: {
            orderBy: [{ createdAt: 'desc' }],
            take: 1,
            select: {
              id: true,
              provider: true,
              providerTransactionId: true,
              status: true,
              amountToman: true,
            },
          },
          items: {
            orderBy: [{ id: 'asc' }],
            select: { id: true, quantity: true, totalToman: true },
          },
          shipment: { select: { status: true } },
          returnRequest: {
            select: {
              id: true,
              status: true,
              items: { select: { orderItemId: true, quantity: true } },
            },
          },
        },
      });
      if (!current) throw new NotFoundException('سفارش پیدا نشد.');
      if (!current.returnRequest) {
        throw new NotFoundException('درخواست مرجوعی پیدا نشد.');
      }
      assertReturnTransition(current.returnRequest.status, target);
      if (expected && current.updatedAt.getTime() !== expected.getTime()) {
        throw new ConflictException('نسخه سفارش تغییر کرده است.');
      }

      if (target !== 'RECEIVED') {
        if (current.returnRequest.status === target) return { refund: null };
        const now = new Date();
        const orderUpdated = await transaction.order.updateMany({
          where: { id: current.id, updatedAt: current.updatedAt },
          data: { updatedAt: now },
        });
        if (orderUpdated.count !== 1) {
          throw new ConflictException('سفارش هم‌زمان تغییر کرده است.');
        }
        await transaction.returnRequest.update({
          where: { id: current.returnRequest.id },
          data: {
            status: target,
            reviewedAt: now,
            reviewedByStaffId: staff.id,
          },
        });
        await this.audit?.record(
          {
            actorType: 'STAFF',
            actorUserId: staff.id,
            action: 'return.reviewed',
            resourceType: 'ReturnRequest',
            resourceId: current.returnRequest.id,
            metadata: { status: target, reason, orderNumber },
          },
          transaction,
        );
        return { refund: null };
      }

      if (
        (current.paymentStatus !== 'PAID' && current.paymentStatus !== 'REFUNDED') ||
        current.status !== 'DELIVERED'
      ) {
        throw new ConflictException('مرجوعی فقط برای سفارش تحویل‌شده و پرداخت‌شده قابل تسویه است.');
      }
      const attempt = current.paymentAttempts[0];
      if (!attempt || attempt.status !== 'SUCCEEDED') {
        throw new ConflictException('تلاش پرداخت سفارش برای بازپرداخت معتبر نیست.');
      }
      const itemMap = new Map(current.items.map((item) => [item.id, item]));
      let amountToman = 0;
      for (const returnItem of current.returnRequest.items) {
        const orderItem = itemMap.get(returnItem.orderItemId);
        if (!orderItem || returnItem.quantity !== orderItem.quantity) {
          throw new ConflictException('اقلام مرجوعی با سفارش هم‌خوان نیستند.');
        }
        amountToman += orderItem.totalToman;
      }
      if (amountToman < 1 || amountToman > current.totalToman) {
        throw new ConflictException('مبلغ مرجوعی سفارش معتبر نیست.');
      }

      if (current.returnRequest.status === 'APPROVED') {
        const now = new Date();
        const orderUpdated = await transaction.order.updateMany({
          where: { id: current.id, updatedAt: current.updatedAt },
          data: { updatedAt: now },
        });
        if (orderUpdated.count !== 1) {
          throw new ConflictException('سفارش هم‌زمان تغییر کرده است.');
        }
        await transaction.returnRequest.update({
          where: { id: current.returnRequest.id },
          data: {
            status: 'RECEIVED',
            receivedAt: now,
            reviewedAt: now,
            reviewedByStaffId: staff.id,
          },
        });
        await this.audit?.record(
          {
            actorType: 'STAFF',
            actorUserId: staff.id,
            action: 'return.received',
            resourceType: 'ReturnRequest',
            resourceId: current.returnRequest.id,
            metadata: { reason, orderNumber, amountToman },
          },
          transaction,
        );
      }

      return {
        refund: {
          orderId: current.id,
          orderNumber: current.orderNumber,
          returnRequestId: current.returnRequest.id,
          paymentAttemptId: attempt.id,
          provider: attempt.provider,
          providerTransactionId: attempt.providerTransactionId ?? undefined,
          amountToman,
          fullOrder:
            current.items.length === current.returnRequest.items.length &&
            current.items.every((item) =>
              current.returnRequest!.items.some(
                (returnItem) =>
                  returnItem.orderItemId === item.id && returnItem.quantity === item.quantity,
              ),
            ),
        },
      };
    });

    if (review.refund) {
      const refund = await this.payments!.processRefund({
        orderId: review.refund.orderId,
        orderNumber: review.refund.orderNumber,
        paymentAttemptId: review.refund.paymentAttemptId,
        provider: review.refund.provider,
        providerTransactionId: review.refund.providerTransactionId,
        amountToman: review.refund.amountToman,
        idempotencyKey: `return:${review.refund.returnRequestId}`,
        returnRequestId: review.refund.returnRequestId,
        reason,
      });
      if (refund.refundStatus === 'SUCCEEDED') {
        await this.database.prisma.$transaction(async (transaction) => {
          const now = new Date();
          const updated = await transaction.returnRequest.updateMany({
            where: { id: review.refund!.returnRequestId, status: 'RECEIVED' },
            data: { status: 'REFUNDED', reviewedAt: now, reviewedByStaffId: staff.id },
          });
          if (updated.count === 0) {
            const existing = await transaction.returnRequest.findUnique({
              where: { id: review.refund!.returnRequestId },
              select: { status: true },
            });
            if (existing?.status !== 'REFUNDED') {
              throw new ConflictException('وضعیت درخواست مرجوعی هم‌زمان تغییر کرده است.');
            }
            return;
          }
          if (review.refund!.fullOrder) {
            const orderUpdated = await transaction.order.updateMany({
              where: { id: review.refund!.orderId, status: 'DELIVERED' },
              data: { status: 'RETURNED' },
            });
            if (orderUpdated.count === 1) {
              await transaction.shipment.updateMany({
                where: { orderId: review.refund!.orderId, status: 'DELIVERED' },
                data: { status: 'RETURNED' },
              });
              await transaction.orderEvent.create({
                data: {
                  orderId: review.refund!.orderId,
                  actorType: 'STAFF',
                  actorId: staff.id,
                  fromStatus: 'DELIVERED',
                  toStatus: 'RETURNED',
                  reason,
                },
              });
            }
          }
          await this.audit?.record(
            {
              actorType: 'STAFF',
              actorUserId: staff.id,
              action: 'return.refunded',
              resourceType: 'ReturnRequest',
              resourceId: review.refund!.returnRequestId,
              metadata: { orderNumber, amountToman: review.refund!.amountToman, reason },
            },
            transaction,
          );
        });
      }
    }

    return this.getForStaff(staff, orderNumber);
  }

  public async updateFulfillmentStatus(
    staff: AuthenticatedStaff,
    orderNumber: string,
    input: AdminOrderStatusDto,
  ): Promise<AdminOrderDetailView> {
    assertStaffRole(staff, 'operations', 'admin');
    assertOrderNumber(orderNumber);
    const reason = assertReason(input.reason);
    const expected = expectedUpdatedAt(input.expectedUpdatedAt);

    const source = await this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.order.findUnique({
        where: { orderNumber },
        select: { id: true, status: true, paymentStatus: true, updatedAt: true },
      });
      if (!current) throw new NotFoundException('سفارش پیدا نشد.');
      if (current.paymentStatus !== 'PAID') {
        throw new ConflictException('سفارش پرداخت‌شده آماده پردازش نیست.');
      }
      if (expected && current.updatedAt.getTime() !== expected.getTime()) {
        throw new ConflictException('نسخه سفارش تغییر کرده است.');
      }

      const target = input.status as OrderStatus;
      assertOrderFulfillmentTransition(current.status, target);
      if (current.status !== target) {
        const updated = await transaction.order.updateMany({
          where: { id: current.id, status: current.status, updatedAt: current.updatedAt },
          data: { status: target },
        });
        if (updated.count !== 1) {
          throw new ConflictException('سفارش هم‌زمان تغییر کرده است.');
        }
        await transaction.orderEvent.create({
          data: {
            orderId: current.id,
            actorType: 'STAFF',
            actorId: staff.id,
            fromStatus: current.status,
            toStatus: target,
            reason,
          },
        });
        await this.audit?.record(
          {
            actorType: 'STAFF',
            actorUserId: staff.id,
            action: 'order.fulfillment.updated',
            resourceType: 'Order',
            resourceId: current.id,
            metadata: { fromStatus: current.status, toStatus: target, reason },
          },
          transaction,
        );
      }

      const latest = await transaction.order.findUnique({
        where: { id: current.id },
        select: adminOrderDetailSelect,
      });
      if (!latest) throw new NotFoundException('سفارش پیدا نشد.');
      return latest;
    });

    return toAdminOrderDetail(source);
  }

  public async updateShipment(
    staff: AuthenticatedStaff,
    orderNumber: string,
    input: AdminShipmentUpdateDto,
  ): Promise<AdminOrderDetailView> {
    assertStaffRole(staff, 'operations', 'admin');
    assertOrderNumber(orderNumber);
    const reason = assertReason(input.reason);
    const expected = expectedUpdatedAt(input.expectedUpdatedAt);
    const provider = input.provider.trim();
    const method = input.method.trim();
    const trackingReference = input.trackingReference?.trim() || null;
    if (!provider || !method) throw new BadRequestException('اطلاعات ارسال معتبر نیست.');

    const source = await this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.order.findUnique({
        where: { orderNumber },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          shippingToman: true,
          updatedAt: true,
          shipment: {
            select: {
              id: true,
              provider: true,
              method: true,
              trackingReference: true,
              status: true,
              shippedAt: true,
              deliveredAt: true,
              updatedAt: true,
            },
          },
        },
      });
      if (!current) throw new NotFoundException('سفارش پیدا نشد.');
      if (current.paymentStatus !== 'PAID') {
        throw new ConflictException('برای سفارش پرداخت‌نشده ارسال ثبت نمی‌شود.');
      }
      if (expected && current.updatedAt.getTime() !== expected.getTime()) {
        throw new ConflictException('نسخه سفارش تغییر کرده است.');
      }

      const currentShipmentStatus = current.shipment?.status ?? 'PENDING';
      const targetShipmentStatus = input.status as ShipmentStatus;
      assertShipmentTransition(currentShipmentStatus, targetShipmentStatus);

      let nextOrderStatus = current.status;
      if (targetShipmentStatus === 'PACKED') {
        if (current.status === 'CONFIRMED') nextOrderStatus = 'PREPARING';
        else if (current.status !== 'PREPARING') {
          throw new ConflictException('وضعیت سفارش با بسته‌بندی هم‌خوان نیست.');
        }
      } else if (targetShipmentStatus === 'SHIPPED') {
        if (current.status === 'PREPARING') nextOrderStatus = 'SHIPPED';
        else if (current.status !== 'SHIPPED') {
          throw new ConflictException('وضعیت سفارش با ارسال هم‌خوان نیست.');
        }
      } else if (targetShipmentStatus === 'DELIVERED') {
        if (current.status === 'SHIPPED') nextOrderStatus = 'DELIVERED';
        else if (current.status !== 'DELIVERED') {
          throw new ConflictException('وضعیت سفارش با تحویل هم‌خوان نیست.');
        }
      }

      const shipmentChanged =
        !current.shipment ||
        current.shipment.provider !== provider ||
        current.shipment.method !== method ||
        current.shipment.status !== targetShipmentStatus ||
        current.shipment.trackingReference !== trackingReference;
      const orderChanged = nextOrderStatus !== current.status;
      if (!shipmentChanged && !orderChanged) {
        const latest = await transaction.order.findUnique({
          where: { id: current.id },
          select: adminOrderDetailSelect,
        });
        if (!latest) throw new NotFoundException('سفارش پیدا نشد.');
        return latest;
      }

      const now = new Date();
      const orderUpdated = await transaction.order.updateMany({
        where: { id: current.id, updatedAt: current.updatedAt },
        data: {
          updatedAt: now,
          ...(orderChanged ? { status: nextOrderStatus } : {}),
        },
      });
      if (orderUpdated.count !== 1) {
        throw new ConflictException('سفارش هم‌زمان تغییر کرده است.');
      }

      await transaction.shipment.upsert({
        where: { orderId: current.id },
        create: {
          orderId: current.id,
          provider,
          method,
          trackingReference,
          status: targetShipmentStatus,
          shippingToman: current.shippingToman,
          ...(targetShipmentStatus === 'SHIPPED' ? { shippedAt: now } : {}),
          ...(targetShipmentStatus === 'DELIVERED'
            ? { shippedAt: now, deliveredAt: now }
            : {}),
        },
        update: {
          provider,
          method,
          trackingReference,
          status: targetShipmentStatus,
          ...(targetShipmentStatus === 'SHIPPED' && !current.shipment?.shippedAt
            ? { shippedAt: now }
            : {}),
          ...(targetShipmentStatus === 'DELIVERED' && !current.shipment?.deliveredAt
            ? { deliveredAt: now }
            : {}),
        },
      });

      if (orderChanged) {
        await transaction.orderEvent.create({
          data: {
            orderId: current.id,
            actorType: 'STAFF',
            actorId: staff.id,
            fromStatus: current.status,
            toStatus: nextOrderStatus,
            reason,
          },
        });
      }
      await this.audit?.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'order.shipment.updated',
          resourceType: 'Shipment',
          resourceId: current.shipment?.id ?? current.id,
          metadata: {
            status: targetShipmentStatus,
            trackingReference,
            reason,
            ...(orderChanged ? { orderStatus: nextOrderStatus } : {}),
          },
        },
        transaction,
      );

      const latest = await transaction.order.findUnique({
        where: { id: current.id },
        select: adminOrderDetailSelect,
      });
      if (!latest) throw new NotFoundException('سفارش پیدا نشد.');
      return latest;
    });

    return toAdminOrderDetail(source);
  }
}
