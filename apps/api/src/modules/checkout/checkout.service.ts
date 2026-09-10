import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { OrderStatus, PaymentAttemptStatus, PaymentStatus } from '@nova/db';
import { Prisma } from '@nova/db';

import { DatabaseService } from '../../database/database.service';
import { AddressService, type CustomerAddress } from '../addresses/address.service';
import { CartService, type AuthoritativeCart } from '../cart/cart.service';
import {
  COUPON_RESERVATION_TTL_MS,
  CouponService,
  type CouponDiscount,
} from '../coupons/coupon.service';
import { InventoryService, type InventoryReservationBatch } from '../inventory/inventory.service';
import { PAYMENT_GATEWAY, type PaymentGateway, type PaymentStartResult } from './payment.gateway';
import { SHIPPING_PROVIDER, type ShippingMethod, type ShippingProvider } from './shipping.provider';

export const CHECKOUT_QUOTE_TTL_SECONDS = 5 * 60;

const POSTGRES_INT_MAX = 2_147_483_647;
const idempotencyKeyPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const identifierPattern = /^[A-Za-z0-9_-]{1,128}$/;

export interface CheckoutQuoteInput {
  userId: string;
  addressId: string;
  shippingMethod: ShippingMethod;
  couponCode?: string;
}

export interface CheckoutSubmitInput extends CheckoutQuoteInput {
  idempotencyKey: string;
}

export interface CheckoutSelectedOption {
  key: string;
  name: string;
  valueKey: string;
  valueLabel: string;
}

export interface CheckoutQuoteLine {
  cartItemId: string;
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  selectedOptions: CheckoutSelectedOption[];
  quantity: number;
  unitPriceToman: number;
  compareAtPriceToman: number | null;
  lineTotalToman: number;
  variantSnapshot: Prisma.InputJsonValue;
}

export interface CheckoutQuote {
  cartId: string;
  address: CustomerAddress;
  shippingMethod: ShippingMethod;
  shippingLabel: string;
  shippingEstimate: string;
  lines: CheckoutQuoteLine[];
  subtotalToman: number;
  discountToman: number;
  coupon: CouponDiscount | null;
  shippingToman: number;
  taxToman: number;
  totalToman: number;
  currency: 'TOMAN';
  expiresAt: Date;
}

export interface CheckoutPayment {
  status: PaymentAttemptStatus;
  redirectUrl: string | null;
}

export interface CheckoutResult {
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
  payment: CheckoutPayment;
}

interface OrderResultSource {
  id: string;
  userId: string | null;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalToman: number;
  discountToman: number;
  shippingToman: number;
  taxToman: number;
  totalToman: number;
  paymentAttempts: Array<{
    status: PaymentAttemptStatus;
    redirectUrl: string | null;
  }>;
}

const orderResultSelect = {
  id: true,
  userId: true,
  orderNumber: true,
  status: true,
  paymentStatus: true,
  subtotalToman: true,
  discountToman: true,
  shippingToman: true,
  taxToman: true,
  totalToman: true,
  paymentAttempts: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { status: true, redirectUrl: true },
  },
} as const;

function assertIdentifier(value: string, message: string): void {
  if (!identifierPattern.test(value)) throw new BadRequestException(message);
}

function assertIdempotencyKey(value: string): void {
  if (!idempotencyKeyPattern.test(value)) {
    throw new BadRequestException('کلید تکرارنشدن درخواست معتبر نیست.');
  }
}

function addMoney(left: number, right: number): number {
  const result = left + right;
  if (!Number.isSafeInteger(result) || result < 0 || result > POSTGRES_INT_MAX) {
    throw new ConflictException('مبلغ سفارش از محدوده مجاز خارج است.');
  }
  return result;
}

function multiplyMoney(value: number, quantity: number): number {
  const result = value * quantity;
  if (!Number.isSafeInteger(result) || result < 0 || result > POSTGRES_INT_MAX) {
    throw new ConflictException('مبلغ سفارش از محدوده مجاز خارج است.');
  }
  return result;
}

function isAvailable(item: AuthoritativeCart['items'][number]): boolean {
  const inventory = item.variant.inventory;
  return (
    item.variant.isActive &&
    item.variant.product.status === 'PUBLISHED' &&
    item.variant.product.archivedAt === null &&
    inventory !== null &&
    inventory.onHand - inventory.reserved >= item.quantity
  );
}

function resolveCompareAtPrice(item: AuthoritativeCart['items'][number]): number | null {
  const { product } = item.variant;
  const unitPriceToman = item.variant.priceToman ?? product.basePriceToman;
  const compareAtPriceToman = item.variant.compareAtPriceToman ?? product.compareAtPriceToman;

  return compareAtPriceToman !== null && compareAtPriceToman > unitPriceToman
    ? compareAtPriceToman
    : null;
}

function createOrderNumber(): string {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = randomBytes(4).toString('hex').toUpperCase();
  return `NV-${timePart}-${randomPart}`;
}

function selectedOptions(item: AuthoritativeCart['items'][number]): CheckoutSelectedOption[] {
  return (item.variant.optionValues ?? []).map(({ optionValue }) => ({
    key: optionValue.option.key,
    name: optionValue.option.name,
    valueKey: optionValue.key,
    valueLabel: optionValue.label,
  }));
}

function lineSnapshot(
  item: AuthoritativeCart['items'][number],
  options: CheckoutSelectedOption[],
): Prisma.InputJsonValue {
  const optionSnapshot = options.map((option) => ({
    key: option.key,
    name: option.name,
    valueKey: option.valueKey,
    valueLabel: option.valueLabel,
  })) as Prisma.InputJsonArray;

  return {
    sku: item.variant.sku,
    title: item.variant.title,
    size: item.variant.size ?? null,
    color: item.variant.color ?? null,
    colorHex: item.variant.colorHex ?? null,
    options: optionSnapshot,
  };
}

function toCheckoutResult(source: OrderResultSource): CheckoutResult {
  const payment = source.paymentAttempts[0];
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
    payment: {
      status: payment?.status ?? 'PENDING',
      redirectUrl: payment?.redirectUrl ?? null,
    },
  };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

@Injectable()
export class CheckoutService {
  public constructor(
    private readonly database: DatabaseService,
    private readonly carts: CartService,
    private readonly addresses: AddressService,
    private readonly inventory: InventoryService,
    @Inject(SHIPPING_PROVIDER) private readonly shipping: ShippingProvider,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway: PaymentGateway,
    @Optional() private readonly coupons?: CouponService,
  ) {}

  public async quote(input: CheckoutQuoteInput): Promise<CheckoutQuote> {
    return this.buildQuote(input);
  }

  public async submit(input: CheckoutSubmitInput): Promise<CheckoutResult> {
    assertIdentifier(input.userId, 'شناسه مشتری معتبر نیست.');
    assertIdentifier(input.addressId, 'شناسه آدرس معتبر نیست.');
    assertIdempotencyKey(input.idempotencyKey);

    const existing = await this.findOrderByIdempotencyKey(input.idempotencyKey);
    if (existing) return this.forCustomer(existing, input.userId);

    const quote = await this.buildQuote(input);
    const intent = await this.createOrderIntent(quote, input);
    if (!intent.created) return this.forCustomer(intent.order, input.userId);

    let reservations: InventoryReservationBatch | undefined;
    let paymentAttemptId: string | undefined;
    try {
      reservations = await this.inventory.reserve({
        orderId: intent.order.id,
        lines: quote.lines.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
        })),
      });

      const paymentAttempt = await this.database.prisma.paymentAttempt.create({
        data: {
          orderId: intent.order.id,
          provider: this.paymentGateway.name,
          status: 'PENDING',
          amountToman: quote.totalToman,
          idempotencyKey: `${input.idempotencyKey}:payment`,
        },
        select: { id: true },
      });
      paymentAttemptId = paymentAttempt.id;

      const started = await this.paymentGateway.startPayment({
        orderNumber: intent.order.orderNumber,
        amountToman: quote.totalToman,
        idempotencyKey: input.idempotencyKey,
      });
      this.assertRedirectUrl(started);

      await this.database.prisma.paymentAttempt.update({
        where: { id: paymentAttempt.id },
        data: {
          status: 'REDIRECTED',
          redirectUrl: started.redirectUrl,
          ...(started.providerTransactionId
            ? { providerTransactionId: started.providerTransactionId }
            : {}),
        },
      });
    } catch (error) {
      let cleanupError: unknown;
      if (paymentAttemptId) {
        try {
          await this.database.prisma.paymentAttempt.updateMany({
            where: { id: paymentAttemptId, status: 'PENDING' },
            data: { status: 'FAILED' },
          });
        } catch (updateError) {
          cleanupError = updateError;
        }
      }
      if (reservations) {
        try {
          await this.releaseReservations(reservations);
        } catch (releaseError) {
          cleanupError ??= releaseError;
        }
      }
      try {
        await this.cancelOrder(
          intent.order.id,
          error instanceof Error ? error.message : 'checkout-failed',
        );
      } catch (cancelError) {
        cleanupError ??= cancelError;
      }
      if (cleanupError)
        throw new Error('Checkout failure cleanup did not complete.', { cause: cleanupError });
      throw error;
    }

    const completed = await this.findOrderByIdempotencyKey(input.idempotencyKey);
    if (!completed) throw new Error('Created checkout order could not be reloaded.');
    return this.forCustomer(completed, input.userId);
  }

  private async buildQuote(input: CheckoutQuoteInput): Promise<CheckoutQuote> {
    assertIdentifier(input.userId, 'شناسه مشتری معتبر نیست.');
    assertIdentifier(input.addressId, 'شناسه آدرس معتبر نیست.');
    if (input.shippingMethod !== 'STANDARD' && input.shippingMethod !== 'EXPRESS') {
      throw new BadRequestException('روش ارسال معتبر نیست.');
    }

    const cart = await this.carts.getCustomerCartForCheckout(input.userId);
    if (!cart || cart.items.length === 0) {
      throw new ConflictException('سبد خرید خالی است.');
    }

    const lines: CheckoutQuoteLine[] = [];
    let subtotalToman = 0;
    for (const item of cart.items) {
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        throw new ConflictException('تعداد یکی از کالاهای سبد معتبر نیست.');
      }
      if (!isAvailable(item)) {
        throw new ConflictException(`موجودی «${item.variant.product.name}» تغییر کرده است.`);
      }

      const unitPriceToman = item.variant.priceToman ?? item.variant.product.basePriceToman;
      if (!Number.isSafeInteger(unitPriceToman) || unitPriceToman < 0) {
        throw new ConflictException('قیمت یکی از کالاهای سبد معتبر نیست.');
      }
      const options = selectedOptions(item);
      const lineTotalToman = multiplyMoney(unitPriceToman, item.quantity);
      subtotalToman = addMoney(subtotalToman, lineTotalToman);
      lines.push({
        cartItemId: item.id,
        productId: item.variant.product.id,
        variantId: item.variant.id,
        productName: item.variant.product.name,
        sku: item.variant.sku,
        selectedOptions: options,
        quantity: item.quantity,
        unitPriceToman,
        compareAtPriceToman: resolveCompareAtPrice(item),
        lineTotalToman,
        variantSnapshot: lineSnapshot(item, options),
      });
    }

    const address = await this.addresses.get(input.userId, input.addressId);
    const shipping = await this.shipping.quote({
      method: input.shippingMethod,
      province: address.province,
      subtotalToman,
    });
    if (
      !Number.isSafeInteger(shipping.amountToman) ||
      shipping.amountToman < 0 ||
      shipping.amountToman > POSTGRES_INT_MAX
    ) {
      throw new ConflictException('هزینه ارسال معتبر نیست.');
    }

    let coupon: CouponDiscount | null = null;
    if (input.couponCode) {
      if (!this.coupons) {
        throw new ServiceUnavailableException('سرویس کد تخفیف هنوز پیکربندی نشده است.');
      }
      coupon = await this.coupons.preview({
        code: input.couponCode,
        userId: input.userId,
        subtotalToman,
      });
    }
    const discountToman = coupon?.discountToman ?? 0;
    const taxToman = 0;
    const grossTotalToman = addMoney(addMoney(subtotalToman, shipping.amountToman), taxToman);
    if (discountToman > grossTotalToman) throw new ConflictException('تخفیف سفارش معتبر نیست.');
    const totalToman = grossTotalToman - discountToman;

    return {
      cartId: cart.id,
      address,
      shippingMethod: shipping.method,
      shippingLabel: shipping.label,
      shippingEstimate: shipping.estimate,
      lines,
      subtotalToman,
      discountToman,
      coupon,
      shippingToman: shipping.amountToman,
      taxToman,
      totalToman,
      currency: 'TOMAN',
      expiresAt: new Date(Date.now() + CHECKOUT_QUOTE_TTL_SECONDS * 1_000),
    };
  }

  private async findOrderByIdempotencyKey(key: string): Promise<OrderResultSource | null> {
    return this.database.prisma.order.findUnique({
      where: { idempotencyKey: key },
      select: orderResultSelect,
    });
  }

  private async createOrderIntent(
    quote: CheckoutQuote,
    input: CheckoutSubmitInput,
  ): Promise<{ created: boolean; order: OrderResultSource }> {
    try {
      const intent = await this.database.prisma.$transaction(async (transaction) => {
        const current = await transaction.order.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          select: orderResultSelect,
        });
        if (current) return { created: false, order: current };

        const created = await transaction.order.create({
          data: {
            orderNumber: createOrderNumber(),
            userId: input.userId,
            cartId: quote.cartId,
            status: 'PENDING_PAYMENT',
            paymentStatus: 'PENDING',
            moneyUnit: 'TOMAN',
            subtotalToman: quote.subtotalToman,
            discountToman: quote.discountToman,
            shippingToman: quote.shippingToman,
            taxToman: quote.taxToman,
            totalToman: quote.totalToman,
            idempotencyKey: input.idempotencyKey,
          },
          select: { id: true, orderNumber: true },
        });

        if (quote.coupon) {
          if (!this.coupons) {
            throw new ServiceUnavailableException('سرویس کد تخفیف هنوز پیکربندی نشده است.');
          }
          await this.coupons.reserveForOrder(
            {
              code: quote.coupon.code,
              userId: input.userId,
              orderId: created.id,
              subtotalToman: quote.subtotalToman,
              reservedUntil: new Date(Date.now() + COUPON_RESERVATION_TTL_MS),
            },
            transaction,
          );
        }

        await transaction.orderItem.createMany({
          data: quote.lines.map((line) => ({
            orderId: created.id,
            productId: line.productId,
            variantId: line.variantId,
            productNameSnapshot: line.productName,
            skuSnapshot: line.sku,
            variantSnapshot: line.variantSnapshot,
            quantity: line.quantity,
            unitPriceToman: line.unitPriceToman,
            compareAtPriceToman: line.compareAtPriceToman,
            discountToman: 0,
            taxToman: 0,
            totalToman: line.lineTotalToman,
          })),
        });
        await transaction.orderAddressSnapshot.create({
          data: {
            orderId: created.id,
            recipientName: quote.address.recipientName,
            phone: quote.address.phone,
            province: quote.address.province,
            city: quote.address.city,
            addressLine: quote.address.addressLine,
            postalCode: quote.address.postalCode,
          },
        });
        await transaction.shipment.create({
          data: {
            orderId: created.id,
            provider: 'local',
            method: quote.shippingMethod,
            shippingToman: quote.shippingToman,
            status: 'PENDING',
          },
        });
        await transaction.orderEvent.create({
          data: {
            orderId: created.id,
            actorType: 'CUSTOMER',
            actorId: input.userId,
            toStatus: 'PENDING_PAYMENT',
            reason: 'checkout-created',
          },
        });
        return {
          created: true,
          order: {
            ...created,
            userId: input.userId,
            status: 'PENDING_PAYMENT' as const,
            paymentStatus: 'PENDING' as const,
            subtotalToman: quote.subtotalToman,
            discountToman: quote.discountToman,
            shippingToman: quote.shippingToman,
            taxToman: quote.taxToman,
            totalToman: quote.totalToman,
            paymentAttempts: [],
          },
        };
      });

      return intent;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const existing = await this.findOrderByIdempotencyKey(input.idempotencyKey);
      if (!existing) throw error;
      return { created: false, order: existing };
    }
  }

  private forCustomer(source: OrderResultSource, userId: string): CheckoutResult {
    if (source.userId !== userId) throw new ConflictException('این درخواست برای مشتری دیگری است.');
    return toCheckoutResult(source);
  }

  private assertRedirectUrl(result: PaymentStartResult): void {
    try {
      const url = new URL(result.redirectUrl);
      if (url.protocol !== 'https:') throw new Error('unsupported payment redirect');
    } catch {
      throw new Error('Payment gateway returned an invalid redirect URL.');
    }
  }

  private async releaseReservations(batch: InventoryReservationBatch): Promise<void> {
    const failures: unknown[] = [];
    for (const reservation of batch.reservations) {
      try {
        await this.inventory.release(reservation.id);
      } catch (error) {
        failures.push(error);
      }
    }
    if (failures.length > 0) {
      throw new Error('One or more checkout reservations could not be released.');
    }
  }

  private async cancelOrder(orderId: string, reason: string): Promise<void> {
    await this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.order.findUnique({
        where: { id: orderId },
        select: { status: true, paymentStatus: true },
      });
      if (!current || current.status === 'CANCELLED') return;
      await transaction.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
      });
      await transaction.orderEvent.create({
        data: {
          orderId,
          actorType: 'SYSTEM',
          toStatus: 'CANCELLED',
          reason: reason.slice(0, 500),
        },
      });
      await this.coupons?.releaseForOrder(orderId, transaction);
    });
  }
}
