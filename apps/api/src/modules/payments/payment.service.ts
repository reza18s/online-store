import { createHash } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@nova/db';
import type { PaymentStatus, RefundStatus } from '@nova/db';

import { AuditService } from '../audit/audit.service';
import { DatabaseService } from '../../database/database.service';
import { InventoryService, type InventoryReservationLine } from '../inventory/inventory.service';
import { CouponService } from '../coupons/coupon.service';
import { NotificationService } from '../notifications/notification.service';
import {
  PAYMENT_GATEWAY,
  type PaymentCallbackResult,
  type PaymentGateway,
  type PaymentRefundResult,
} from '../checkout/payment.gateway';

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;
const ORDER_NUMBER_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const POSTGRES_INT_MAX = 2_147_483_647;

const paymentAttemptSelect = {
  id: true,
  orderId: true,
  provider: true,
  providerTransactionId: true,
  status: true,
  amountToman: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      addressSnapshot: {
        select: { phone: true },
      },
      items: {
        orderBy: [{ id: 'asc' }],
        select: { variantId: true, quantity: true },
      },
    },
  },
} satisfies Prisma.PaymentAttemptSelect;

export type PaymentCallbackOutcome = 'PAID' | 'FAILED' | 'DUPLICATE' | 'REFUNDED' | 'REFUND_FAILED';

export interface PaymentCallbackInput {
  provider: string;
  payload: unknown;
  signature?: string;
}

export interface PaymentCallbackView {
  provider: string;
  providerEventId: string;
  orderNumber: string;
  outcome: PaymentCallbackOutcome;
  paymentStatus: PaymentStatus | null;
  refundStatus: RefundStatus | null;
}

export interface ProcessRefundInput {
  orderId: string;
  orderNumber: string;
  paymentAttemptId?: string;
  provider: string;
  providerTransactionId?: string;
  amountToman: number;
  idempotencyKey: string;
  reason: string;
  returnRequestId?: string;
}

export interface ProcessRefundView {
  refundId: string;
  refundStatus: RefundStatus;
  providerRefundId: string | null;
  paymentStatus: PaymentStatus;
}

interface WebhookRegistration {
  id: string;
  duplicate: boolean;
}

interface PaymentAttemptSource {
  id: string;
  orderId: string;
  provider: string;
  providerTransactionId: string | null;
  status: 'PENDING' | 'REDIRECTED' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  amountToman: number;
  order: {
    id: string;
    orderNumber: string;
    status:
      | 'PENDING_PAYMENT'
      | 'CONFIRMED'
      | 'PREPARING'
      | 'SHIPPED'
      | 'DELIVERED'
      | 'CANCELLED'
    | 'RETURNED';
    paymentStatus: PaymentStatus;
    addressSnapshot: { phone: string } | null;
    items: Array<{ variantId: string | null; quantity: number }>;
  };
}

interface RefundSource {
  id: string;
  status: RefundStatus;
  providerRefundId: string | null;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function isBusinessInventoryError(error: unknown): boolean {
  return error instanceof ConflictException || error instanceof NotFoundException;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

function payloadHash(payload: unknown): string {
  const canonical = JSON.stringify(canonicalize(payload)) ?? 'null';
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

function assertIdentifier(value: string, message: string): void {
  if (!IDENTIFIER_PATTERN.test(value)) throw new BadRequestException(message);
}

function assertOrderNumber(value: string): void {
  if (!ORDER_NUMBER_PATTERN.test(value)) {
    throw new BadRequestException('شماره سفارش پرداخت معتبر نیست.');
  }
}

function assertAmount(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > POSTGRES_INT_MAX) {
    throw new BadRequestException('مبلغ پرداخت معتبر نیست.');
  }
}

function processingErrorCode(error: unknown): string {
  if (error instanceof BadRequestException) return 'invalid-callback';
  if (error instanceof ConflictException) return 'callback-conflict';
  if (error instanceof NotFoundException) return 'callback-not-found';
  return 'callback-processing-failed';
}

function validateCallback(provider: string, callback: PaymentCallbackResult): void {
  if (!IDENTIFIER_PATTERN.test(provider)) {
    throw new BadRequestException('شناسه درگاه پرداخت معتبر نیست.');
  }
  assertIdentifier(callback.providerEventId, 'شناسه رویداد پرداخت معتبر نیست.');
  assertOrderNumber(callback.orderNumber);
  assertAmount(callback.amountToman);
  if (callback.status !== 'PAID' && callback.status !== 'FAILED') {
    throw new BadRequestException('وضعیت callback پرداخت معتبر نیست.');
  }
  if (
    callback.providerTransactionId !== undefined &&
    !IDENTIFIER_PATTERN.test(callback.providerTransactionId)
  ) {
    throw new BadRequestException('شناسه تراکنش پرداخت معتبر نیست.');
  }
}

@Injectable()
export class PaymentService {
  public constructor(
    private readonly database: DatabaseService,
    private readonly inventory: InventoryService,
    private readonly audit: AuditService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    @Optional() private readonly notifications?: NotificationService,
    @Optional() private readonly coupons?: CouponService,
  ) {}

  public async handleCallback(input: PaymentCallbackInput): Promise<PaymentCallbackView> {
    if (input.provider !== this.gateway.name) {
      throw new NotFoundException('درگاه پرداخت پیدا نشد.');
    }

    const callback = await this.gateway.verifyCallback({
      payload: input.payload,
      signature: input.signature,
    });
    validateCallback(input.provider, callback);

    const registration = await this.registerWebhook(
      input.provider,
      callback.providerEventId,
      payloadHash(input.payload),
    );
    if (registration.duplicate) {
      return {
        provider: input.provider,
        providerEventId: callback.providerEventId,
        orderNumber: callback.orderNumber,
        outcome: 'DUPLICATE',
        paymentStatus: null,
        refundStatus: null,
      };
    }

    try {
      const result = await this.applyCallback(input.provider, callback, payloadHash(input.payload));
      await this.database.prisma.webhookEvent.update({
        where: { id: registration.id },
        data: {
          processedAt: new Date(),
          error: result.outcome === 'REFUND_FAILED' ? 'refund-failed' : null,
        },
      });
      return result;
    } catch (error) {
      await this.database.prisma.webhookEvent.update({
        where: { id: registration.id },
        data: { processedAt: new Date(), error: processingErrorCode(error) },
      });
      throw error;
    }
  }

  public async processRefund(input: ProcessRefundInput): Promise<ProcessRefundView> {
    assertIdentifier(input.orderId, 'شناسه سفارش برای بازپرداخت معتبر نیست.');
    assertOrderNumber(input.orderNumber);
    assertIdentifier(input.provider, 'شناسه درگاه پرداخت معتبر نیست.');
    if (input.paymentAttemptId !== undefined) {
      assertIdentifier(input.paymentAttemptId, 'شناسه تلاش پرداخت معتبر نیست.');
    }
    if (input.providerTransactionId !== undefined) {
      assertIdentifier(input.providerTransactionId, 'شناسه تراکنش پرداخت معتبر نیست.');
    }
    if (input.returnRequestId !== undefined) {
      assertIdentifier(input.returnRequestId, 'شناسه درخواست مرجوعی معتبر نیست.');
    }
    assertAmount(input.amountToman);
    if (input.amountToman < 1) {
      throw new BadRequestException('مبلغ بازپرداخت باید مثبت باشد.');
    }
    assertIdentifier(input.idempotencyKey, 'کلید بازپرداخت معتبر نیست.');
    const reason = input.reason.trim();
    if (!reason || reason.length > 500) {
      throw new BadRequestException('دلیل بازپرداخت معتبر نیست.');
    }
    if (input.provider !== this.gateway.name) {
      throw new NotFoundException('درگاه پرداخت پیدا نشد.');
    }

    const order = await this.database.prisma.order.findUnique({
      where: { id: input.orderId },
      select: { id: true, orderNumber: true, totalToman: true, paymentStatus: true },
    });
    if (!order || order.orderNumber !== input.orderNumber) {
      throw new NotFoundException('سفارش برای بازپرداخت پیدا نشد.');
    }
    const existingRefund = await this.database.prisma.refund.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true, status: true, providerRefundId: true },
    });
    if (existingRefund?.status === 'SUCCEEDED') {
      return {
        refundId: existingRefund.id,
        refundStatus: existingRefund.status,
        providerRefundId: existingRefund.providerRefundId,
        paymentStatus: order.paymentStatus,
      };
    }
    if (order.paymentStatus !== 'PAID') {
      throw new ConflictException('فقط سفارش پرداخت‌شده قابل بازپرداخت است.');
    }
    const refund = existingRefund ?? (await this.findOrCreateRefund(input, reason));
    if (refund.status === 'SUCCEEDED') {
      return {
        refundId: refund.id,
        refundStatus: refund.status,
        providerRefundId: refund.providerRefundId,
        paymentStatus: order.paymentStatus,
      };
    }

    let result: PaymentRefundResult;
    try {
      result = await this.gateway.refundPayment({
        orderNumber: input.orderNumber,
        amountToman: input.amountToman,
        isFullRefund: input.amountToman === order.totalToman,
        providerTransactionId: input.providerTransactionId,
        idempotencyKey: input.idempotencyKey,
        reason,
      });
      this.assertRefundResult(result);
    } catch {
      await this.database.prisma.refund.update({
        where: { id: refund.id },
        data: { status: 'FAILED' },
      });
      await this.audit.record({
        actorType: 'SYSTEM',
        action: 'payment.refund.failed',
        resourceType: 'Refund',
        resourceId: refund.id,
        metadata: {
          provider: input.provider,
          orderNumber: input.orderNumber,
          amountToman: input.amountToman,
          reason,
        },
      });
      return {
        refundId: refund.id,
        refundStatus: 'FAILED',
        providerRefundId: refund.providerRefundId,
        paymentStatus: order.paymentStatus,
      };
    }

    const paymentStatus = await this.database.prisma.$transaction(async (transaction) => {
      await transaction.refund.update({
        where: { id: refund.id },
        data: {
          status: 'SUCCEEDED',
          ...(result.providerRefundId
            ? { providerRefundId: result.providerRefundId }
            : {}),
          completedAt: new Date(),
        },
      });
      const nextPaymentStatus =
        input.amountToman === order.totalToman && order.paymentStatus === 'PAID'
          ? 'REFUNDED'
          : order.paymentStatus;
      if (nextPaymentStatus === 'REFUNDED') {
        await transaction.order.updateMany({
          where: { id: order.id, paymentStatus: 'PAID' },
          data: { paymentStatus: 'REFUNDED' },
        });
      }
      return nextPaymentStatus;
    });
    await this.audit.record({
      actorType: 'SYSTEM',
      action: 'payment.refund.succeeded',
      resourceType: 'Refund',
      resourceId: refund.id,
      metadata: {
        provider: input.provider,
        orderNumber: input.orderNumber,
        amountToman: input.amountToman,
        reason,
      },
    });
    return {
      refundId: refund.id,
      refundStatus: 'SUCCEEDED',
      providerRefundId: result.providerRefundId ?? null,
      paymentStatus,
    };
  }

  private assertRefundResult(result: PaymentRefundResult): void {
    if (result.providerRefundId !== undefined) {
      assertIdentifier(result.providerRefundId, 'شناسه بازپرداخت معتبر نیست.');
    }
  }

  private async findOrCreateRefund(
    input: ProcessRefundInput,
    reason: string,
  ): Promise<RefundSource> {
    const existing = await this.database.prisma.refund.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true, status: true, providerRefundId: true },
    });
    if (existing) return existing;

    try {
      return await this.database.prisma.refund.create({
        data: {
          orderId: input.orderId,
          ...(input.paymentAttemptId ? { paymentAttemptId: input.paymentAttemptId } : {}),
          ...(input.returnRequestId ? { returnRequestId: input.returnRequestId } : {}),
          provider: input.provider,
          amountToman: input.amountToman,
          idempotencyKey: input.idempotencyKey,
          reason,
        },
        select: { id: true, status: true, providerRefundId: true },
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const raced = await this.database.prisma.refund.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: { id: true, status: true, providerRefundId: true },
      });
      if (!raced) throw error;
      return raced;
    }
  }

  private async registerWebhook(
    provider: string,
    providerEventId: string,
    hash: string,
  ): Promise<WebhookRegistration> {
    const existing = await this.database.prisma.webhookEvent.findUnique({
      where: { provider_providerEventId: { provider, providerEventId } },
      select: { id: true, payloadHash: true, processedAt: true },
    });
    if (existing) {
      if (existing.payloadHash !== hash) {
        throw new ConflictException('محتوای callback تکراری با رویداد اصلی هم‌خوان نیست.');
      }
      return { id: existing.id, duplicate: existing.processedAt !== null };
    }

    try {
      const created = await this.database.prisma.webhookEvent.create({
        data: { provider, providerEventId, payloadHash: hash },
        select: { id: true },
      });
      return { id: created.id, duplicate: false };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const raced = await this.database.prisma.webhookEvent.findUnique({
        where: { provider_providerEventId: { provider, providerEventId } },
        select: { id: true, payloadHash: true, processedAt: true },
      });
      if (!raced) throw error;
      if (raced.payloadHash !== hash) {
        throw new ConflictException('محتوای callback تکراری با رویداد اصلی هم‌خوان نیست.');
      }
      return { id: raced.id, duplicate: raced.processedAt !== null };
    }
  }

  private async applyCallback(
    provider: string,
    callback: PaymentCallbackResult,
    hash: string,
  ): Promise<PaymentCallbackView> {
    const attempt = (await this.database.prisma.paymentAttempt.findFirst({
      where: {
        provider,
        order: { orderNumber: callback.orderNumber },
      },
      orderBy: [{ createdAt: 'desc' }],
      select: paymentAttemptSelect,
    })) as PaymentAttemptSource | null;
    if (!attempt) throw new NotFoundException('تلاش پرداخت برای سفارش پیدا نشد.');
    if (
      callback.providerTransactionId !== undefined &&
      attempt.providerTransactionId !== null &&
      callback.providerTransactionId !== attempt.providerTransactionId
    ) {
      throw new ConflictException('شناسه تراکنش پرداخت با سفارش هم‌خوان نیست.');
    }
    if (callback.amountToman !== attempt.amountToman) {
      throw new ConflictException('مبلغ callback پرداخت با سفارش هم‌خوان نیست.');
    }

    if (callback.status === 'FAILED') {
      return this.applyFailedCallback(provider, callback, hash, attempt);
    }
    return this.applyPaidCallback(provider, callback, hash, attempt);
  }

  private async applyFailedCallback(
    provider: string,
    callback: PaymentCallbackResult,
    hash: string,
    attempt: PaymentAttemptSource,
  ): Promise<PaymentCallbackView> {
    if (attempt.status === 'SUCCEEDED' || attempt.order.paymentStatus === 'PAID') {
      throw new ConflictException('پرداخت موفق را نمی‌توان ناموفق کرد.');
    }
    if (attempt.status === 'FAILED' && attempt.order.paymentStatus === 'FAILED') {
      return {
        provider,
        providerEventId: callback.providerEventId,
        orderNumber: callback.orderNumber,
        outcome: 'FAILED',
        paymentStatus: 'FAILED',
        refundStatus: null,
      };
    }

    await this.database.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.paymentAttempt.updateMany({
        where: { id: attempt.id, status: { in: ['PENDING', 'REDIRECTED'] } },
        data: {
          status: 'FAILED',
          providerEventId: callback.providerEventId,
          rawPayloadHash: hash,
        },
      });
      if (claimed.count !== 1) {
        throw new ConflictException('وضعیت تلاش پرداخت هم‌زمان تغییر کرده است.');
      }

      const orderUpdated = await transaction.order.updateMany({
        where: { id: attempt.orderId, status: 'PENDING_PAYMENT', paymentStatus: 'PENDING' },
        data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
      });
      if (orderUpdated.count === 1) {
        await transaction.orderEvent.create({
          data: {
            orderId: attempt.orderId,
            actorType: 'SYSTEM',
            fromStatus: 'PENDING_PAYMENT',
            toStatus: 'CANCELLED',
            reason: 'payment-failed-callback',
          },
        });
        await this.notifications?.enqueuePaymentEvent(
          {
            kind: 'PAYMENT_FAILED',
            paymentAttemptId: attempt.id,
            orderId: attempt.order.id,
            orderNumber: callback.orderNumber,
            recipient: attempt.order.addressSnapshot?.phone ?? '',
            amountToman: attempt.amountToman,
          },
          transaction,
        );
        await this.coupons?.releaseForOrder(attempt.orderId, transaction);
      }
    });

    await this.inventory.releaseForOrder(attempt.orderId);
    await this.audit.record({
      actorType: 'SYSTEM',
      action: 'payment.callback.failed',
      resourceType: 'PaymentAttempt',
      resourceId: attempt.id,
      metadata: {
        provider,
        providerEventId: callback.providerEventId,
        orderNumber: callback.orderNumber,
      },
    });
    return {
      provider,
      providerEventId: callback.providerEventId,
      orderNumber: callback.orderNumber,
      outcome: 'FAILED',
      paymentStatus: 'FAILED',
      refundStatus: null,
    };
  }

  private async applyPaidCallback(
    provider: string,
    callback: PaymentCallbackResult,
    hash: string,
    attempt: PaymentAttemptSource,
  ): Promise<PaymentCallbackView> {
    if (attempt.order.paymentStatus === 'REFUNDED') {
      return {
        provider,
        providerEventId: callback.providerEventId,
        orderNumber: callback.orderNumber,
        outcome: 'DUPLICATE',
        paymentStatus: 'REFUNDED',
        refundStatus: null,
      };
    }

    const requiresLatePaymentHandling =
      attempt.order.status === 'CANCELLED' || attempt.order.paymentStatus === 'FAILED';
    if (!requiresLatePaymentHandling) {
      const settlement = await this.inventory.consumeForOrder(attempt.orderId);
      if (settlement === 'CONSUMED') {
        return this.confirmPaidOrder(provider, callback, hash, attempt);
      }
    }

    const lines = this.orderReservationLines(attempt);
    if (lines.length === 0) {
      return this.handleLatePayment(provider, callback, hash, attempt);
    }

    try {
      await this.inventory.reserve({ orderId: attempt.orderId, lines });
      const settlement = await this.inventory.consumeForOrder(attempt.orderId);
      if (settlement === 'CONSUMED') {
        return this.confirmPaidOrder(provider, callback, hash, attempt);
      }
    } catch (error) {
      if (!isBusinessInventoryError(error)) throw error;
    }
    return this.handleLatePayment(provider, callback, hash, attempt);
  }

  private orderReservationLines(attempt: PaymentAttemptSource): InventoryReservationLine[] {
    if (
      attempt.order.items.length === 0 ||
      attempt.order.items.some(
        (item) =>
          item.variantId === null || !Number.isSafeInteger(item.quantity) || item.quantity < 1,
      )
    ) {
      return [];
    }
    return attempt.order.items.map((item) => ({
      variantId: item.variantId!,
      quantity: item.quantity,
    }));
  }

  private async confirmPaidOrder(
    provider: string,
    callback: PaymentCallbackResult,
    hash: string,
    attempt: PaymentAttemptSource,
  ): Promise<PaymentCallbackView> {
    await this.database.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.paymentAttempt.updateMany({
        where: { id: attempt.id, status: { in: ['PENDING', 'REDIRECTED'] } },
        data: {
          status: 'SUCCEEDED',
          providerEventId: callback.providerEventId,
          ...(callback.providerTransactionId
            ? { providerTransactionId: callback.providerTransactionId }
            : {}),
          rawPayloadHash: hash,
          paidAt: new Date(),
        },
      });
      if (claimed.count !== 1) {
        throw new ConflictException('وضعیت تلاش پرداخت هم‌زمان تغییر کرده است.');
      }

      const orderUpdated = await transaction.order.updateMany({
        where: { id: attempt.orderId, status: 'PENDING_PAYMENT', paymentStatus: 'PENDING' },
        data: { status: 'CONFIRMED', paymentStatus: 'PAID' },
      });
      if (orderUpdated.count !== 1) {
        throw new ConflictException('وضعیت سفارش برای تأیید پرداخت معتبر نیست.');
      }
      await transaction.orderEvent.create({
        data: {
          orderId: attempt.orderId,
          actorType: 'SYSTEM',
          fromStatus: 'PENDING_PAYMENT',
          toStatus: 'CONFIRMED',
          reason: 'payment-succeeded-callback',
        },
      });
      await this.notifications?.enqueuePaymentEvent(
        {
          kind: 'PAYMENT_SUCCEEDED',
          paymentAttemptId: attempt.id,
          orderId: attempt.order.id,
          orderNumber: callback.orderNumber,
          recipient: attempt.order.addressSnapshot?.phone ?? '',
          amountToman: attempt.amountToman,
        },
        transaction,
      );
      await this.coupons?.commitForOrder(attempt.orderId, transaction);
    });

    await this.audit.record({
      actorType: 'SYSTEM',
      action: 'payment.callback.succeeded',
      resourceType: 'PaymentAttempt',
      resourceId: attempt.id,
      metadata: {
        provider,
        providerEventId: callback.providerEventId,
        orderNumber: callback.orderNumber,
      },
    });
    return {
      provider,
      providerEventId: callback.providerEventId,
      orderNumber: callback.orderNumber,
      outcome: 'PAID',
      paymentStatus: 'PAID',
      refundStatus: null,
    };
  }

  private async handleLatePayment(
    provider: string,
    callback: PaymentCallbackResult,
    hash: string,
    attempt: PaymentAttemptSource,
  ): Promise<PaymentCallbackView> {
    await this.database.prisma.$transaction(async (transaction) => {
      await transaction.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'SUCCEEDED',
          providerEventId: callback.providerEventId,
          ...(callback.providerTransactionId
            ? { providerTransactionId: callback.providerTransactionId }
            : {}),
          rawPayloadHash: hash,
          paidAt: new Date(),
        },
      });
      await transaction.order.update({
        where: { id: attempt.orderId },
        data: { status: 'CANCELLED', paymentStatus: 'PAID' },
      });
      await transaction.orderEvent.create({
        data: {
          orderId: attempt.orderId,
          actorType: 'SYSTEM',
          fromStatus: attempt.order.status,
          toStatus: 'CANCELLED',
          reason: 'late-payment-inventory-unavailable',
        },
      });
      await this.coupons?.releaseForOrder(attempt.orderId, transaction);
    });

    const refund = await this.createRefund(attempt, provider);
    try {
      const result = await this.gateway.refundPayment({
        orderNumber: callback.orderNumber,
        amountToman: attempt.amountToman,
        isFullRefund: true,
        providerTransactionId:
          callback.providerTransactionId ?? attempt.providerTransactionId ?? undefined,
        idempotencyKey: `late-payment:${attempt.id}`,
        reason: 'late-payment-inventory-unavailable',
      });
      if (result.providerRefundId !== undefined) {
        assertIdentifier(result.providerRefundId, 'شناسه بازپرداخت معتبر نیست.');
      }
      await this.database.prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: 'SUCCEEDED',
          ...(result.providerRefundId ? { providerRefundId: result.providerRefundId } : {}),
          completedAt: new Date(),
        },
      });
      await this.database.prisma.order.update({
        where: { id: attempt.orderId },
        data: { paymentStatus: 'REFUNDED' },
      });
      await this.audit.record({
        actorType: 'SYSTEM',
        action: 'payment.late.refunded',
        resourceType: 'Refund',
        resourceId: refund.id,
        metadata: {
          provider,
          providerEventId: callback.providerEventId,
          orderNumber: callback.orderNumber,
        },
      });
      return {
        provider,
        providerEventId: callback.providerEventId,
        orderNumber: callback.orderNumber,
        outcome: 'REFUNDED' as const,
        paymentStatus: 'REFUNDED' as const,
        refundStatus: 'SUCCEEDED' as const,
      };
    } catch {
      await this.database.prisma.refund.update({
        where: { id: refund.id },
        data: { status: 'FAILED' },
      });
      await this.audit.record({
        actorType: 'SYSTEM',
        action: 'payment.late.refund_failed',
        resourceType: 'Refund',
        resourceId: refund.id,
        metadata: {
          provider,
          providerEventId: callback.providerEventId,
          orderNumber: callback.orderNumber,
        },
      });
      return {
        provider,
        providerEventId: callback.providerEventId,
        orderNumber: callback.orderNumber,
        outcome: 'REFUND_FAILED' as const,
        paymentStatus: 'PAID' as const,
        refundStatus: 'FAILED' as const,
      };
    }
  }

  private async createRefund(
    attempt: PaymentAttemptSource,
    provider: string,
  ): Promise<RefundSource> {
    const idempotencyKey = `late-payment:${attempt.id}`;
    const existing = await this.database.prisma.refund.findUnique({
      where: { idempotencyKey },
      select: { id: true, status: true, providerRefundId: true },
    });
    if (existing) return existing;

    try {
      return await this.database.prisma.refund.create({
        data: {
          orderId: attempt.orderId,
          paymentAttemptId: attempt.id,
          provider,
          amountToman: attempt.amountToman,
          idempotencyKey,
          reason: 'late-payment-inventory-unavailable',
        },
        select: { id: true, status: true, providerRefundId: true },
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const raced = await this.database.prisma.refund.findUnique({
        where: { idempotencyKey },
        select: { id: true, status: true, providerRefundId: true },
      });
      if (!raced) throw error;
      return raced;
    }
  }
}
