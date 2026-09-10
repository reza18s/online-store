import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@nova/db';
import type { InventoryReservationStatus } from '@nova/db';

import { DatabaseService } from '../../database/database.service';

export const INVENTORY_RESERVATION_TTL_SECONDS = 15 * 60;
export const INVENTORY_MAX_RESERVATION_LINES = 100;
const POSTGRES_INT_MAX = 2_147_483_647;

type ReservationTerminalStatus = 'CONSUMED' | 'RELEASED' | 'EXPIRED';

export interface InventoryReservationLine {
  variantId: string;
  quantity: number;
}

export interface ReserveInventoryInput {
  lines: readonly InventoryReservationLine[];
  orderId?: string | null;
}

export interface InventoryReservationView {
  id: string;
  variantId: string;
  orderId: string | null;
  quantity: number;
  status: InventoryReservationStatus;
  expiresAt: Date;
}

export interface InventoryReservationBatch {
  reservations: InventoryReservationView[];
  expiresAt: Date;
}

export type OrderReservationSettlement = 'CONSUMED' | 'REACQUIRE_REQUIRED';

interface ReservationSource {
  id: string;
  inventoryItemId: string;
  orderId: string | null;
  quantity: number;
  status: InventoryReservationStatus;
  expiresAt: Date;
  inventoryItem: {
    variantId: string;
  };
}

interface TransitionOptions {
  at?: Date;
  ignoreTerminal?: boolean;
  requireDue?: boolean;
}

const reservationSelect = {
  id: true,
  inventoryItemId: true,
  orderId: true,
  quantity: true,
  status: true,
  expiresAt: true,
  inventoryItem: { select: { variantId: true } },
} as const;

function isIdentifier(value: string): boolean {
  return /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

function assertIdentifier(value: string, message: string): void {
  if (!isIdentifier(value)) throw new BadRequestException(message);
}

function assertQuantity(quantity: number): void {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > POSTGRES_INT_MAX) {
    throw new BadRequestException('تعداد رزرو باید یک عدد صحیح مثبت باشد.');
  }
}

function normalizeLines(lines: readonly InventoryReservationLine[]): InventoryReservationLine[] {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new BadRequestException('رزرو موجودی باید حداقل یک کالا داشته باشد.');
  }
  if (lines.length > INVENTORY_MAX_RESERVATION_LINES) {
    throw new BadRequestException('تعداد کالاهای این رزرو بیش از حد مجاز است.');
  }

  const seen = new Set<string>();
  return lines
    .map((line) => {
      if (!line || typeof line.variantId !== 'string') {
        throw new BadRequestException('شناسه تنوع کالا معتبر نیست.');
      }
      assertIdentifier(line.variantId, 'شناسه تنوع کالا معتبر نیست.');
      if (seen.has(line.variantId)) {
        throw new BadRequestException('هر تنوع کالا باید فقط یک‌بار در رزرو بیاید.');
      }
      seen.add(line.variantId);
      assertQuantity(line.quantity);
      return { variantId: line.variantId, quantity: line.quantity };
    })
    .sort((left, right) => (left.variantId < right.variantId ? -1 : 1));
}

function assertDate(value: Date): void {
  if (Number.isNaN(value.getTime())) {
    throw new BadRequestException('زمان انقضای رزرو معتبر نیست.');
  }
}

function assertLimit(limit: number): void {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1_000) {
    throw new BadRequestException('تعداد رزروهای قابل انقضا معتبر نیست.');
  }
}

export function toInventoryReservationView(source: ReservationSource): InventoryReservationView {
  return {
    id: source.id,
    variantId: source.inventoryItem.variantId,
    orderId: source.orderId,
    quantity: source.quantity,
    status: source.status,
    expiresAt: source.expiresAt,
  };
}

@Injectable()
export class InventoryService {
  public constructor(private readonly database: DatabaseService) {}

  public async reserve(input: ReserveInventoryInput): Promise<InventoryReservationBatch> {
    const lines = normalizeLines(input.lines);
    const orderId = input.orderId ?? null;
    if (orderId !== null) assertIdentifier(orderId, 'شناسه سفارش معتبر نیست.');
    const expiresAt = new Date(Date.now() + INVENTORY_RESERVATION_TTL_SECONDS * 1_000);

    const reservations = await this.database.prisma.$transaction(async (transaction) => {
      const created: InventoryReservationView[] = [];

      for (const line of lines) {
        const variant = await transaction.productVariant.findFirst({
          where: {
            id: line.variantId,
            isActive: true,
            product: { status: 'PUBLISHED', archivedAt: null },
          },
          select: { id: true },
        });
        if (!variant) throw new NotFoundException('تنوع کالا قابل رزرو نیست.');

        const inventory = await transaction.inventoryItem.findUnique({
          where: { variantId: line.variantId },
          select: { id: true },
        });
        if (!inventory) throw new NotFoundException('موجودی تنوع انتخاب‌شده پیدا نشد.');

        const updatedRows = await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          UPDATE "InventoryItem"
          SET "reserved" = "reserved" + ${line.quantity},
              "updatedAt" = NOW()
          WHERE "id" = ${inventory.id}
            AND "onHand" - "reserved" >= ${line.quantity}
          RETURNING "id"
        `);
        if (updatedRows.length !== 1) {
          throw new ConflictException('موجودی این تنوع برای رزرو کافی نیست.');
        }

        const reservation = await transaction.inventoryReservation.create({
          data: {
            inventoryItemId: inventory.id,
            orderId,
            quantity: line.quantity,
            status: 'ACTIVE',
            expiresAt,
          },
          select: reservationSelect,
        });
        await transaction.stockMovement.create({
          data: {
            inventoryItemId: inventory.id,
            type: 'RESERVATION',
            quantity: line.quantity,
            reference: `reservation:${reservation.id}`,
          },
        });
        created.push(toInventoryReservationView(reservation));
      }

      return created;
    });

    return { reservations, expiresAt };
  }

  public async attachToOrder(
    reservationId: string,
    orderId: string,
  ): Promise<InventoryReservationView> {
    assertIdentifier(reservationId, 'شناسه رزرو معتبر نیست.');
    assertIdentifier(orderId, 'شناسه سفارش معتبر نیست.');

    const reservation = await this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.inventoryReservation.findUnique({
        where: { id: reservationId },
        select: reservationSelect,
      });
      if (!current) throw new NotFoundException('رزرو موجودی پیدا نشد.');
      if (current.orderId === orderId) return current;
      if (current.status !== 'ACTIVE' || current.orderId !== null) {
        throw new ConflictException('رزرو موجودی به سفارش دیگری متصل است.');
      }

      const updated = await transaction.inventoryReservation.updateMany({
        where: { id: reservationId, status: 'ACTIVE', orderId: null },
        data: { orderId },
      });
      if (updated.count !== 1) {
        throw new ConflictException('رزرو موجودی هم‌زمان تغییر کرده است.');
      }
      return transaction.inventoryReservation.findUnique({
        where: { id: reservationId },
        select: reservationSelect,
      });
    });

    if (!reservation) throw new NotFoundException('رزرو موجودی پیدا نشد.');
    return toInventoryReservationView(reservation);
  }

  public async consume(reservationId: string): Promise<InventoryReservationView> {
    return (await this.transitionReservation(reservationId, 'CONSUMED')).view;
  }

  public async consumeForOrder(
    orderId: string,
    now = new Date(),
  ): Promise<OrderReservationSettlement> {
    assertIdentifier(orderId, 'شناسه سفارش معتبر نیست.');
    assertDate(now);

    const reservations = await this.database.prisma.inventoryReservation.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      select: reservationSelect,
    });
    if (reservations.some((reservation) => reservation.status === 'CONSUMED')) {
      return 'CONSUMED';
    }

    const active = reservations.filter((reservation) => reservation.status === 'ACTIVE');
    if (active.length === 0) return 'REACQUIRE_REQUIRED';

    const expired = active.filter((reservation) => reservation.expiresAt <= now);
    if (expired.length > 0) {
      for (const reservation of expired) {
        await this.transitionReservation(reservation.id, 'EXPIRED', {
          at: now,
          ignoreTerminal: true,
          requireDue: true,
        });
      }
      for (const reservation of active) {
        if (expired.some((candidate) => candidate.id === reservation.id)) continue;
        await this.transitionReservation(reservation.id, 'RELEASED', {
          at: now,
          ignoreTerminal: true,
        });
      }
      return 'REACQUIRE_REQUIRED';
    }

    for (const reservation of active) {
      await this.transitionReservation(reservation.id, 'CONSUMED', {
        at: now,
        ignoreTerminal: true,
      });
    }
    return 'CONSUMED';
  }

  public async release(reservationId: string): Promise<InventoryReservationView> {
    return (await this.transitionReservation(reservationId, 'RELEASED')).view;
  }

  public async releaseForOrder(orderId: string, at = new Date()): Promise<void> {
    assertIdentifier(orderId, 'شناسه سفارش معتبر نیست.');
    assertDate(at);

    const reservations = await this.database.prisma.inventoryReservation.findMany({
      where: { orderId, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      select: reservationSelect,
    });
    for (const reservation of reservations) {
      await this.transitionReservation(
        reservation.id,
        reservation.expiresAt <= at ? 'EXPIRED' : 'RELEASED',
        {
          at,
          ignoreTerminal: true,
          ...(reservation.expiresAt <= at ? { requireDue: true } : {}),
        },
      );
    }
  }

  public async expire(reservationId: string): Promise<InventoryReservationView> {
    return (
      await this.transitionReservation(reservationId, 'EXPIRED', {
        requireDue: true,
      })
    ).view;
  }

  public async expireDue(now = new Date(), limit = 100): Promise<number> {
    assertDate(now);
    assertLimit(limit);
    const candidates = await this.database.prisma.inventoryReservation.findMany({
      where: { status: 'ACTIVE', expiresAt: { lte: now } },
      orderBy: { expiresAt: 'asc' },
      take: limit,
      select: { id: true },
    });

    let expiredCount = 0;
    for (const candidate of candidates) {
      const result = await this.transitionReservation(candidate.id, 'EXPIRED', {
        at: now,
        ignoreTerminal: true,
        requireDue: true,
      });
      if (result.changed) expiredCount += 1;
    }
    return expiredCount;
  }

  private async transitionReservation(
    reservationId: string,
    target: ReservationTerminalStatus,
    options: TransitionOptions = {},
  ): Promise<{ changed: boolean; view: InventoryReservationView }> {
    assertIdentifier(reservationId, 'شناسه رزرو معتبر نیست.');
    const now = options.at ?? new Date();
    assertDate(now);

    const result = await this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.inventoryReservation.findUnique({
        where: { id: reservationId },
        select: reservationSelect,
      });
      if (!current) throw new NotFoundException('رزرو موجودی پیدا نشد.');
      if (current.status === target) {
        return { changed: false, source: current };
      }
      if (current.status !== 'ACTIVE') {
        if (options.ignoreTerminal) return { changed: false, source: current };
        throw new ConflictException('وضعیت رزرو موجودی قابل تغییر نیست.');
      }
      if (options.requireDue && current.expiresAt > now) {
        throw new ConflictException('مهلت این رزرو هنوز تمام نشده است.');
      }
      if (target === 'CONSUMED' && current.expiresAt <= now) {
        throw new ConflictException('مهلت رزرو موجودی تمام شده است.');
      }

      const claimed = await transaction.inventoryReservation.updateMany({
        where: { id: reservationId, status: 'ACTIVE' },
        data: {
          status: target,
          releasedAt: target === 'CONSUMED' ? null : now,
        },
      });
      if (claimed.count !== 1) {
        const latest = await transaction.inventoryReservation.findUnique({
          where: { id: reservationId },
          select: reservationSelect,
        });
        if (!latest) throw new NotFoundException('رزرو موجودی پیدا نشد.');
        if (options.ignoreTerminal) return { changed: false, source: latest };
        if (latest.status === target) return { changed: false, source: latest };
        throw new ConflictException('رزرو موجودی هم‌زمان تغییر کرده است.');
      }

      const inventoryUpdated =
        target === 'CONSUMED'
          ? await transaction.inventoryItem.updateMany({
              where: {
                id: current.inventoryItemId,
                onHand: { gte: current.quantity },
                reserved: { gte: current.quantity },
              },
              data: {
                onHand: { decrement: current.quantity },
                reserved: { decrement: current.quantity },
              },
            })
          : await transaction.inventoryItem.updateMany({
              where: {
                id: current.inventoryItemId,
                reserved: { gte: current.quantity },
              },
              data: { reserved: { decrement: current.quantity } },
            });
      if (inventoryUpdated.count !== 1) {
        throw new ConflictException('وضعیت موجودی برای این رزرو معتبر نیست.');
      }

      await transaction.stockMovement.create({
        data: {
          inventoryItemId: current.inventoryItemId,
          type: target === 'CONSUMED' ? 'SALE' : 'RELEASE',
          quantity: -current.quantity,
          reference: `reservation:${reservationId}`,
        },
      });

      const updated = await transaction.inventoryReservation.findUnique({
        where: { id: reservationId },
        select: reservationSelect,
      });
      if (!updated) throw new NotFoundException('رزرو موجودی پیدا نشد.');
      return { changed: true, source: updated };
    });

    return { changed: result.changed, view: toInventoryReservationView(result.source) };
  }
}
