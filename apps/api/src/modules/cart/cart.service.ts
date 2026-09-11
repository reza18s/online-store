import { createHash, randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CartItemMutation,
  CartLine,
  CartMergeConflict,
  CartMergeResolution,
  CartView,
} from '@nova/api-client';
import { DatabaseClient, Prisma } from '@nova/db';

import { DatabaseService } from '../../database/database.service';

export const CART_COOKIE_NAME = 'nova_cart';
export const CART_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const CART_ITEM_MAX_QUANTITY = 99;
const CART_TOKEN_BYTES = 32;

export interface AuthoritativeCart {
  id: string;
  kind: 'GUEST' | 'CUSTOMER';
  items: Array<{
    id: string;
    variantId: string;
    quantity: number;
    variant: {
      id: string;
      sku: string;
      title: string | null;
      size?: string | null;
      color?: string | null;
      colorHex?: string | null;
      priceToman: number | null;
      compareAtPriceToman: number | null;
      isActive: boolean;
      inventory: { onHand: number; reserved: number } | null;
      optionValues?: Array<{
        optionValue: {
          key: string;
          label: string;
          option: { key: string; name: string };
        };
      }>;
      product: {
        id: string;
        slug: string;
        name: string;
        status: string;
        archivedAt: Date | null;
        basePriceToman: number;
        compareAtPriceToman: number | null;
        media: Array<{ url: string; altText: string }>;
      };
    };
  }>;
}

interface CartIdentity {
  id: string;
  token?: string;
}

type CartDatabase = DatabaseClient | Prisma.TransactionClient;

export interface CartMutationResult {
  cart: CartView;
  token?: string;
}

const cartSelect = {
  id: true,
  kind: true,
  items: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      variantId: true,
      quantity: true,
      variant: {
        select: {
          id: true,
          sku: true,
          title: true,
          size: true,
          color: true,
          colorHex: true,
          priceToman: true,
          compareAtPriceToman: true,
          isActive: true,
          inventory: { select: { onHand: true, reserved: true } },
          optionValues: {
            select: {
              optionValue: {
                select: {
                  key: true,
                  label: true,
                  option: { select: { key: true, name: true } },
                },
              },
            },
          },
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              status: true,
              archivedAt: true,
              basePriceToman: true,
              compareAtPriceToman: true,
              media: {
                where: { kind: 'PRODUCT' as const },
                orderBy: { sortOrder: 'asc' as const },
                take: 1,
                select: { url: true, altText: true },
              },
            },
          },
        },
      },
    },
  },
} as const;

export function createCartToken(): string {
  return randomBytes(CART_TOKEN_BYTES).toString('base64url');
}

export function hashCartToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function isAvailable(source: AuthoritativeCart['items'][number]['variant']): boolean {
  return (
    source.isActive &&
    source.product.status === 'PUBLISHED' &&
    source.product.archivedAt === null &&
    source.inventory !== null &&
    source.inventory.onHand - source.inventory.reserved > 0
  );
}

interface MergeVariantState {
  isActive: boolean;
  inventory: { onHand: number; reserved: number } | null;
  product: { status: string; archivedAt: Date | null };
}

function mergeAvailableQuantity(source: MergeVariantState): number | null {
  if (
    !source.isActive ||
    source.product.status !== 'PUBLISHED' ||
    source.product.archivedAt !== null ||
    source.inventory === null
  ) {
    return null;
  }

  return Math.max(0, source.inventory.onHand - source.inventory.reserved);
}

function resolveCompareAtPrice(item: AuthoritativeCart['items'][number]): number | null {
  const { product } = item.variant;
  const unitPriceToman = item.variant.priceToman ?? product.basePriceToman;
  const compareAtPriceToman = item.variant.compareAtPriceToman ?? product.compareAtPriceToman;

  return compareAtPriceToman !== null && compareAtPriceToman > unitPriceToman
    ? compareAtPriceToman
    : null;
}

function toCartLine(item: AuthoritativeCart['items'][number]): CartLine {
  const { product } = item.variant;
  const image = product.media[0];
  const unitPriceToman = item.variant.priceToman ?? product.basePriceToman;

  return {
    id: item.id,
    variantId: item.variantId,
    quantity: item.quantity,
    available: isAvailable(item.variant),
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    sku: item.variant.sku,
    title: item.variant.title,
    unitPriceToman,
    compareAtPriceToman: resolveCompareAtPrice(item),
    imageUrl: image?.url ?? null,
    imageAlt: image?.altText ?? product.name,
  };
}

export function toCartView(cart: AuthoritativeCart): CartView {
  const items = cart.items.map(toCartLine);

  return {
    id: cart.id,
    kind: cart.kind,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotalToman: items.reduce((total, item) => total + item.unitPriceToman * item.quantity, 0),
    currency: 'TOMAN',
  };
}

function emptyCart(kind: 'GUEST' | 'CUSTOMER' = 'GUEST'): CartView {
  return {
    id: null,
    kind,
    items: [],
    itemCount: 0,
    subtotalToman: 0,
    currency: 'TOMAN',
  };
}

function assertQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > CART_ITEM_MAX_QUANTITY) {
    throw new BadRequestException('تعداد کالا باید بین ۱ تا ۹۹ باشد.');
  }
}

function assertVariantId(variantId: string): void {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(variantId)) {
    throw new BadRequestException('شناسه تنوع کالا معتبر نیست.');
  }
}

function assertIdempotencyKey(key: string | undefined): void {
  if (key === undefined) return;
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(key)) {
    throw new BadRequestException('کلید تکرارنشدن درخواست معتبر نیست.');
  }
}

@Injectable()
export class CartService {
  public constructor(private readonly database: DatabaseService) {}

  public async getCart(token: string | undefined, userId?: string): Promise<CartView> {
    if (userId) {
      const customerCart = await this.findCustomerCart(userId);
      return customerCart ? toCartView(customerCart) : emptyCart('CUSTOMER');
    }
    if (!token) return emptyCart();

    const cart = await this.findGuestCart(token);
    return cart ? toCartView(cart) : emptyCart();
  }

  public async getCustomerCartForCheckout(userId: string): Promise<AuthoritativeCart | null> {
    return this.findCustomerCart(userId);
  }

  public async addItem(
    token: string | undefined,
    input: CartItemMutation,
    idempotencyKey?: string,
    userId?: string,
  ): Promise<CartMutationResult> {
    assertVariantId(input.variantId);
    assertQuantity(input.quantity);
    assertIdempotencyKey(idempotencyKey);

    const identity = await this.getOrCreateCart(token, userId);
    const cart = await this.database.prisma.$transaction(async (transaction) => {
      const currentCart = await transaction.cart.findUnique({
        where: { id: identity.id },
        select: { id: true },
      });
      if (!currentCart) throw new NotFoundException('سبد خرید پیدا نشد.');

      if (idempotencyKey) {
        const previousMutation = await transaction.cartMutation.findUnique({
          where: {
            cartId_idempotencyKey: {
              cartId: identity.id,
              idempotencyKey,
            },
          },
          select: { variantId: true, quantityDelta: true },
        });
        if (previousMutation) {
          if (
            previousMutation.variantId !== input.variantId ||
            previousMutation.quantityDelta !== input.quantity
          ) {
            throw new ConflictException('این کلید برای درخواست دیگری استفاده شده است.');
          }
          return transaction.cart.findUnique({ where: { id: identity.id }, select: cartSelect });
        }
      }

      const variant = await transaction.productVariant.findFirst({
        where: {
          id: input.variantId,
          isActive: true,
          product: { status: 'PUBLISHED', archivedAt: null },
        },
        select: {
          id: true,
          inventory: { select: { onHand: true, reserved: true } },
        },
      });
      if (!variant) throw new NotFoundException('تنوع انتخاب‌شده پیدا نشد.');
      if (
        variant.inventory === null ||
        variant.inventory.onHand - variant.inventory.reserved <= 0
      ) {
        throw new ConflictException('این تنوع در حال حاضر موجود نیست.');
      }

      const existingItem = await transaction.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId: identity.id,
            variantId: input.variantId,
          },
        },
        select: { quantity: true },
      });
      const nextQuantity = (existingItem?.quantity ?? 0) + input.quantity;
      if (nextQuantity > CART_ITEM_MAX_QUANTITY) {
        throw new BadRequestException('تعداد این کالا در سبد نمی‌تواند بیشتر از ۹۹ باشد.');
      }

      if (existingItem) {
        await transaction.cartItem.update({
          where: {
            cartId_variantId: {
              cartId: identity.id,
              variantId: input.variantId,
            },
          },
          data: { quantity: nextQuantity },
        });
      } else {
        await transaction.cartItem.create({
          data: {
            cartId: identity.id,
            variantId: input.variantId,
            quantity: input.quantity,
          },
        });
      }

      if (idempotencyKey) {
        await transaction.cartMutation.create({
          data: {
            cartId: identity.id,
            idempotencyKey,
            variantId: input.variantId,
            quantityDelta: input.quantity,
          },
        });
      }

      return transaction.cart.findUnique({ where: { id: identity.id }, select: cartSelect });
    });

    if (!cart) throw new NotFoundException('سبد خرید پیدا نشد.');
    return {
      cart: toCartView(cart),
      ...(identity.token ? { token: identity.token } : {}),
    };
  }

  public async updateItem(
    token: string | undefined,
    variantId: string,
    quantity: number,
    userId?: string,
  ): Promise<CartView> {
    assertVariantId(variantId);
    assertQuantity(quantity);
    const identity = await this.requireCart(token, userId);

    const cart = await this.database.prisma.$transaction(async (transaction) => {
      const item = await transaction.cartItem.findUnique({
        where: { cartId_variantId: { cartId: identity.id, variantId } },
        select: { id: true },
      });
      if (!item) throw new NotFoundException('کالا در سبد خرید پیدا نشد.');

      await transaction.cartItem.update({
        where: { id: item.id },
        data: { quantity },
      });
      return transaction.cart.findUnique({ where: { id: identity.id }, select: cartSelect });
    });

    if (!cart) throw new NotFoundException('سبد خرید پیدا نشد.');
    return toCartView(cart);
  }

  public async removeItem(
    token: string | undefined,
    variantId: string,
    userId?: string,
  ): Promise<CartView> {
    assertVariantId(variantId);
    const cart = userId
      ? await this.findCustomerCart(userId)
      : token
        ? await this.findGuestCart(token)
        : null;
    if (!cart) return emptyCart(userId ? 'CUSTOMER' : 'GUEST');

    const updated = await this.database.prisma.$transaction(async (transaction) => {
      await transaction.cartItem.deleteMany({
        where: { cartId: cart.id, variantId },
      });
      return transaction.cart.findUnique({ where: { id: cart.id }, select: cartSelect });
    });

    if (!updated) return emptyCart(userId ? 'CUSTOMER' : 'GUEST');
    return toCartView(updated);
  }

  public async mergeGuestIntoCustomer(
    guestToken: string | undefined,
    userId: string,
    resolutions: CartMergeResolution[] = [],
  ): Promise<CartView> {
    const cart = await this.database.prisma.$transaction(async (transaction) => {
      const customerCartId = await this.ensureCustomerCart(transaction, userId);
      if (!guestToken) {
        return transaction.cart.findUnique({ where: { id: customerCartId }, select: cartSelect });
      }

      let guestCart = await transaction.cart.findFirst({
        where: { tokenHash: hashCartToken(guestToken), kind: 'GUEST' },
        select: {
          id: true,
          expiresAt: true,
          items: {
            select: {
              id: true,
              variantId: true,
              quantity: true,
              variant: {
                select: {
                  isActive: true,
                  inventory: { select: { onHand: true, reserved: true } },
                  product: { select: { status: true, archivedAt: true } },
                },
              },
            },
          },
        },
      });
      if (!guestCart || (guestCart.expiresAt !== null && guestCart.expiresAt <= new Date())) {
        return transaction.cart.findUnique({ where: { id: customerCartId }, select: cartSelect });
      }

      const resolutionByVariant = new Map<string, number>();
      for (const resolution of resolutions) {
        assertVariantId(resolution.variantId);
        if (
          !Number.isSafeInteger(resolution.quantity) ||
          resolution.quantity < 0 ||
          resolution.quantity > CART_ITEM_MAX_QUANTITY
        ) {
          throw new BadRequestException('تعداد انتخاب‌شده برای ادغام سبد معتبر نیست.');
        }
        if (resolutionByVariant.has(resolution.variantId)) {
          throw new BadRequestException('هر تنوع فقط یک‌بار باید در تصمیم ادغام ارسال شود.');
        }
        resolutionByVariant.set(resolution.variantId, resolution.quantity);
      }

      for (const [variantId, quantity] of resolutionByVariant) {
        const guestItem = guestCart.items.find((item) => item.variantId === variantId);
        if (!guestItem) {
          throw new BadRequestException('تنوع انتخاب‌شده در سبد مهمان پیدا نشد.');
        }
        if (quantity > guestItem.quantity) {
          throw new BadRequestException('تعداد انتخاب‌شده نمی‌تواند بیشتر از سبد مهمان باشد.');
        }
        if (quantity === 0) {
          await transaction.cartItem.deleteMany({ where: { id: guestItem.id } });
        } else if (quantity !== guestItem.quantity) {
          await transaction.cartItem.update({
            where: { id: guestItem.id },
            data: { quantity },
          });
        }
      }

      if (resolutions.length > 0) {
        const refreshedGuestCart = await transaction.cart.findFirst({
          where: { id: guestCart.id, kind: 'GUEST' },
          select: {
            id: true,
            expiresAt: true,
            items: {
              select: {
                id: true,
                variantId: true,
                quantity: true,
                variant: {
                  select: {
                    isActive: true,
                    inventory: { select: { onHand: true, reserved: true } },
                    product: { select: { status: true, archivedAt: true } },
                  },
                },
              },
            },
          },
        });
        if (!refreshedGuestCart) throw new NotFoundException('سبد مهمان پیدا نشد.');
        guestCart = refreshedGuestCart;
      }

      const customerCart = await transaction.cart.findUnique({
        where: { id: customerCartId },
        select: { id: true, items: { select: { id: true, variantId: true, quantity: true } } },
      });
      if (!customerCart) throw new NotFoundException('سبد خرید مشتری پیدا نشد.');

      const customerItems = new Map(
        customerCart.items.map((item) => [
          item.variantId,
          { id: item.id, quantity: item.quantity },
        ]),
      );

      const conflicts: CartMergeConflict[] = [];
      for (const guestItem of guestCart.items) {
        const customerQuantity = customerItems.get(guestItem.variantId)?.quantity ?? 0;
        const mergedQuantity = customerQuantity + guestItem.quantity;
        const availableQuantity = mergeAvailableQuantity(guestItem.variant);
        const reason =
          availableQuantity === null
            ? ('VARIANT_UNAVAILABLE' as const)
            : mergedQuantity > CART_ITEM_MAX_QUANTITY
              ? ('QUANTITY_LIMIT' as const)
              : mergedQuantity > availableQuantity
                ? ('STOCK_LIMIT' as const)
                : null;

        if (reason) {
          conflicts.push({
            variantId: guestItem.variantId,
            reason,
            guestQuantity: guestItem.quantity,
            customerQuantity,
            mergedQuantity,
            availableQuantity,
          });
        }
      }

      if (conflicts.length > 0) {
        throw new ConflictException({
          code: 'CART_MERGE_CONFLICT',
          message: 'بخشی از سبد خرید قابل ادغام نیست.',
          details: { conflicts },
        });
      }

      for (const guestItem of guestCart.items) {
        const existing = customerItems.get(guestItem.variantId);
        const nextQuantity = (existing?.quantity ?? 0) + guestItem.quantity;

        if (existing) {
          await transaction.cartItem.update({
            where: { id: existing.id },
            data: { quantity: nextQuantity },
          });
        } else {
          await transaction.cartItem.create({
            data: {
              cartId: customerCartId,
              variantId: guestItem.variantId,
              quantity: guestItem.quantity,
            },
          });
        }
      }

      await transaction.cart.delete({ where: { id: guestCart.id } });
      return transaction.cart.findUnique({ where: { id: customerCartId }, select: cartSelect });
    });

    if (!cart) throw new NotFoundException('سبد خرید مشتری پیدا نشد.');
    return toCartView(cart);
  }

  private async findCustomerCart(
    userId: string,
    client: CartDatabase = this.database.prisma,
  ): Promise<AuthoritativeCart | null> {
    const ownership = await client.cartOwnership.findFirst({
      where: { userId },
      orderBy: { assignedAt: 'desc' },
      select: { cartId: true },
    });
    if (!ownership) return null;

    return client.cart.findUnique({
      where: { id: ownership.cartId, kind: 'CUSTOMER' },
      select: cartSelect,
    });
  }

  private async ensureCustomerCart(client: CartDatabase, userId: string): Promise<string> {
    await client.$executeRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${`customer-cart:${userId}`}, 0))`,
    );
    const existing = await this.findCustomerCart(userId, client);
    if (existing) return existing.id;

    const token = createCartToken();
    const cart = await client.cart.create({
      data: { tokenHash: hashCartToken(token), kind: 'CUSTOMER' },
      select: { id: true },
    });
    await client.cartOwnership.create({ data: { cartId: cart.id, userId } });
    return cart.id;
  }

  private async findGuestCart(
    token: string,
    client: CartDatabase = this.database.prisma,
  ): Promise<AuthoritativeCart | null> {
    const cart = await client.cart.findFirst({
      where: { tokenHash: hashCartToken(token), kind: 'GUEST' },
      select: { ...cartSelect, expiresAt: true },
    });
    if (!cart) return null;
    if (cart.expiresAt !== null && cart.expiresAt <= new Date()) return null;

    return cart;
  }

  private async getOrCreateCart(token: string | undefined, userId?: string): Promise<CartIdentity> {
    if (userId) {
      const id = await this.database.prisma.$transaction((transaction) =>
        this.ensureCustomerCart(transaction, userId),
      );
      return { id };
    }

    if (token) {
      const current = await this.findGuestCart(token);
      if (current) return { id: current.id };
    }

    const freshToken = createCartToken();
    const cart = await this.database.prisma.cart.create({
      data: {
        tokenHash: hashCartToken(freshToken),
        kind: 'GUEST',
        expiresAt: new Date(Date.now() + CART_MAX_AGE_SECONDS * 1000),
      },
      select: { id: true },
    });
    return { id: cart.id, token: freshToken };
  }

  private async requireCart(token: string | undefined, userId?: string): Promise<CartIdentity> {
    if (userId) {
      const cart = await this.findCustomerCart(userId);
      if (!cart) throw new NotFoundException('سبد خرید پیدا نشد.');
      return { id: cart.id };
    }
    if (!token) throw new NotFoundException('سبد خرید پیدا نشد.');
    const cart = await this.findGuestCart(token);
    if (!cart) throw new NotFoundException('سبد خرید پیدا نشد.');
    return { id: cart.id };
  }
}
