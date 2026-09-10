import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@nova/db';
import type { DatabaseClient, PromotionType } from '@nova/db';

import { DatabaseService } from '../../database/database.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { assertStaffRole } from '../staff-auth/staff-auth.guard';
import type { CreateAdminCouponDto, UpdateAdminCouponDto } from './dto/admin-coupon.dto';
import type { AdminCouponListQueryDto } from './dto/admin-coupon.query';

export const COUPON_RESERVATION_TTL_MS = 15 * 60_000;

const COUPON_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{0,63}$/;
const POSTGRES_INT_MAX = 2_147_483_647;

const couponSelect = {
  id: true,
  code: true,
  type: true,
  amount: true,
  minimumOrderToman: true,
  isActive: true,
  activeFrom: true,
  activeUntil: true,
  maxRedemptions: true,
  perUserLimit: true,
} satisfies Prisma.CouponSelect;

const adminCouponSelect = {
  ...couponSelect,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CouponSelect;

type CouponDatabase = DatabaseClient | Prisma.TransactionClient;

interface CouponSource {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  amount: number;
  minimumOrderToman: number;
  isActive: boolean;
  activeFrom: Date;
  activeUntil: Date;
  maxRedemptions: number | null;
  perUserLimit: number | null;
}

interface AdminCouponSource extends CouponSource {
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponDiscount {
  couponId: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  amount: number;
  minimumOrderToman: number;
  discountToman: number;
}

export interface CouponReservation extends CouponDiscount {
  redemptionId: string;
}

export type AdminCouponStatus = 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'DISABLED';

export interface AdminCouponView {
  id: string;
  code: string;
  type: PromotionType;
  amount: number;
  minimumOrderToman: number;
  activeFrom: Date;
  activeUntil: Date;
  maxRedemptions: number | null;
  perUserLimit: number | null;
  status: AdminCouponStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCouponPage {
  items: AdminCouponView[];
  total: number;
  page: number;
  limit: number;
}

export interface CouponPreviewInput {
  code: string;
  userId: string;
  subtotalToman: number;
  now?: Date;
}

export interface CouponReservationInput extends CouponPreviewInput {
  orderId: string;
  reservedUntil: Date;
}

function normalizeCode(value: string): string {
  const code = value.trim().toUpperCase();
  if (!COUPON_CODE_PATTERN.test(code)) {
    throw new BadRequestException('کد تخفیف معتبر نیست.');
  }
  return code;
}

function assertAmount(value: number, message: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > POSTGRES_INT_MAX) {
    throw new ConflictException(message);
  }
}

function isActive(coupon: CouponSource, now: Date): boolean {
  return coupon.isActive && coupon.activeFrom <= now && coupon.activeUntil > now;
}

function adminStatus(coupon: CouponSource, now: Date): AdminCouponStatus {
  if (!coupon.isActive) return 'DISABLED';
  if (coupon.activeFrom > now) return 'UPCOMING';
  if (coupon.activeUntil <= now) return 'EXPIRED';
  return 'ACTIVE';
}

function assertConfiguration(coupon: CouponSource): void {
  assertAmount(coupon.amount, 'پیکربندی کد تخفیف معتبر نیست.');
  assertAmount(coupon.minimumOrderToman, 'حداقل مبلغ کد تخفیف معتبر نیست.');
  if (coupon.activeUntil <= coupon.activeFrom) {
    throw new ConflictException('بازه زمانی کد تخفیف معتبر نیست.');
  }
  if (coupon.type === 'PERCENTAGE' && (coupon.amount < 1 || coupon.amount > 100)) {
    throw new ConflictException('درصد کد تخفیف معتبر نیست.');
  }
  if (
    coupon.maxRedemptions !== null &&
    (!Number.isSafeInteger(coupon.maxRedemptions) || coupon.maxRedemptions < 1)
  ) {
    throw new ConflictException('سقف استفاده از کد تخفیف معتبر نیست.');
  }
  if (
    coupon.perUserLimit !== null &&
    (!Number.isSafeInteger(coupon.perUserLimit) || coupon.perUserLimit < 1)
  ) {
    throw new ConflictException('سقف استفاده مشتری از کد تخفیف معتبر نیست.');
  }
}

function calculateDiscount(coupon: CouponSource, subtotalToman: number): CouponDiscount {
  assertAmount(subtotalToman, 'جمع سبد برای کد تخفیف معتبر نیست.');
  if (subtotalToman < coupon.minimumOrderToman) {
    throw new ConflictException('حداقل مبلغ استفاده از کد تخفیف تأمین نشده است.');
  }

  const rawDiscount =
    coupon.type === 'PERCENTAGE'
      ? Math.floor((subtotalToman * coupon.amount) / 100)
      : coupon.amount;
  const discountToman = Math.min(rawDiscount, subtotalToman);
  assertAmount(discountToman, 'مبلغ تخفیف معتبر نیست.');

  return {
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.type,
    amount: coupon.amount,
    minimumOrderToman: coupon.minimumOrderToman,
    discountToman,
  };
}

function parseAdminDate(value: string, message: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new BadRequestException(message);
  return parsed;
}

function assertAdminCouponId(value: string): void {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(value)) {
    throw new BadRequestException('شناسه کد تخفیف معتبر نیست.');
  }
}

function adminListBounds(query: AdminCouponListQueryDto): { page: number; limit: number } {
  const page = query.page ?? 1;
  const limit = query.limit ?? 24;
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000) {
    throw new BadRequestException('شماره صفحه کدهای تخفیف معتبر نیست.');
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException('اندازه صفحه کدهای تخفیف معتبر نیست.');
  }
  return { page, limit };
}

function toAdminCouponView(source: AdminCouponSource, now: Date): AdminCouponView {
  return {
    id: source.id,
    code: source.code,
    type: source.type,
    amount: source.amount,
    minimumOrderToman: source.minimumOrderToman,
    activeFrom: source.activeFrom,
    activeUntil: source.activeUntil,
    maxRedemptions: source.maxRedemptions,
    perUserLimit: source.perUserLimit,
    status: adminStatus(source, now),
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

@Injectable()
export class CouponService {
  public constructor(
    private readonly database: DatabaseService,
    @Optional() private readonly audit?: AuditService,
  ) {}

  public async preview(input: CouponPreviewInput): Promise<CouponDiscount> {
    const now = input.now ?? new Date();
    const coupon = await this.findCoupon(this.database.prisma, input.code);
    this.assertUsable(coupon, input.subtotalToman, now);
    await this.assertRedemptionCapacity(this.database.prisma, coupon, input.userId, now);
    return calculateDiscount(coupon, input.subtotalToman);
  }

  public async reserveForOrder(
    input: CouponReservationInput,
    database: CouponDatabase = this.database.prisma,
  ): Promise<CouponReservation> {
    const now = input.now ?? new Date();
    const code = normalizeCode(input.code);
    if (!input.orderId || input.orderId.length > 128) {
      throw new BadRequestException('شناسه سفارش برای کد تخفیف معتبر نیست.');
    }
    if (input.reservedUntil <= now) {
      throw new ConflictException('مهلت رزرو کد تخفیف به پایان رسیده است.');
    }

    // Updating the row acquires a PostgreSQL row lock. All reservation paths use
    // this method, so global and per-user limits are checked serially per coupon.
    let coupon: CouponSource;
    try {
      coupon = await database.coupon.update({
        where: { code },
        data: { updatedAt: now },
        select: couponSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ConflictException('کد تخفیف معتبر نیست یا منقضی شده است.');
      }
      throw error;
    }

    this.assertUsable(coupon, input.subtotalToman, now);
    await database.promotionRedemption.updateMany({
      where: {
        couponId: coupon.id,
        status: 'RESERVED',
        reservedUntil: { lte: now },
      },
      data: {
        status: 'RELEASED',
        reservedUntil: null,
        releasedAt: now,
      },
    });
    await this.assertRedemptionCapacity(database, coupon, input.userId, now);

    const redemption = await database.promotionRedemption.create({
      data: {
        couponId: coupon.id,
        userId: input.userId,
        orderId: input.orderId,
        status: 'RESERVED',
        reservedUntil: input.reservedUntil,
      },
      select: { id: true },
    });

    return {
      ...calculateDiscount(coupon, input.subtotalToman),
      redemptionId: redemption.id,
    };
  }

  public async commitForOrder(
    orderId: string,
    database: CouponDatabase = this.database.prisma,
    now = new Date(),
  ): Promise<void> {
    await database.promotionRedemption.updateMany({
      where: { orderId, status: 'RESERVED' },
      data: {
        status: 'COMMITTED',
        reservedUntil: null,
        committedAt: now,
      },
    });
  }

  public async releaseForOrder(
    orderId: string,
    database: CouponDatabase = this.database.prisma,
    now = new Date(),
  ): Promise<void> {
    await database.promotionRedemption.updateMany({
      where: { orderId, status: 'RESERVED' },
      data: {
        status: 'RELEASED',
        reservedUntil: null,
        releasedAt: now,
      },
    });
  }

  public async listForStaff(
    staff: AuthenticatedStaff,
    query: AdminCouponListQueryDto,
  ): Promise<AdminCouponPage> {
    assertStaffRole(staff, 'support', 'operations', 'admin');
    const { page, limit } = adminListBounds(query);
    const now = new Date();
    const status = query.status ?? 'ALL';
    const where: Prisma.CouponWhereInput = {
      ...(query.q ? { code: { contains: query.q, mode: 'insensitive' } } : {}),
      ...(status === 'ACTIVE'
        ? { isActive: true, activeFrom: { lte: now }, activeUntil: { gt: now } }
        : status === 'UPCOMING'
          ? { isActive: true, activeFrom: { gt: now } }
          : status === 'EXPIRED'
            ? { isActive: true, activeUntil: { lte: now } }
            : status === 'DISABLED'
              ? { isActive: false }
              : {}),
    };
    const [total, coupons] = await Promise.all([
      this.database.prisma.coupon.count({ where }),
      this.database.prisma.coupon.findMany({
        where,
        orderBy: [{ activeUntil: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: adminCouponSelect,
      }),
    ]);

    return {
      items: coupons.map((coupon) => toAdminCouponView(coupon, now)),
      total,
      page,
      limit,
    };
  }

  public async createForStaff(
    staff: AuthenticatedStaff,
    input: CreateAdminCouponDto,
  ): Promise<AdminCouponView> {
    assertStaffRole(staff, 'admin');
    const code = normalizeCode(input.code);
    const activeFrom = parseAdminDate(input.activeFrom, 'زمان شروع کد تخفیف معتبر نیست.');
    const activeUntil = parseAdminDate(input.activeUntil, 'زمان پایان کد تخفیف معتبر نیست.');
    const source: CouponSource = {
      id: 'new',
      code,
      type: input.type,
      amount: input.amount,
      minimumOrderToman: input.minimumOrderToman,
      isActive: input.isActive ?? true,
      activeFrom,
      activeUntil,
      maxRedemptions: input.maxRedemptions ?? null,
      perUserLimit: input.perUserLimit ?? null,
    };
    assertConfiguration(source);
    const audit = this.requireAudit();
    try {
      const created = await this.database.prisma.$transaction(async (transaction) => {
        const coupon = await transaction.coupon.create({
          data: {
            code,
            type: input.type,
            amount: input.amount,
            minimumOrderToman: input.minimumOrderToman,
            activeFrom,
            activeUntil,
            maxRedemptions: input.maxRedemptions ?? null,
            perUserLimit: input.perUserLimit ?? null,
            isActive: input.isActive ?? true,
          },
          select: adminCouponSelect,
        });
        await audit.record(
          {
            actorType: 'STAFF',
            actorUserId: staff.id,
            action: 'coupon.created',
            resourceType: 'Coupon',
            resourceId: coupon.id,
            metadata: { code: coupon.code, type: coupon.type, amount: coupon.amount },
          },
          transaction,
        );
        return coupon;
      });
      return toAdminCouponView(created, new Date());
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('این کد تخفیف قبلاً ثبت شده است.');
      }
      throw error;
    }
  }

  public async updateForStaff(
    staff: AuthenticatedStaff,
    couponId: string,
    input: UpdateAdminCouponDto,
  ): Promise<AdminCouponView> {
    assertStaffRole(staff, 'admin');
    assertAdminCouponId(couponId);
    if (
      input.activeFrom === undefined &&
      input.activeUntil === undefined &&
      input.maxRedemptions === undefined &&
      input.perUserLimit === undefined &&
      input.isActive === undefined
    ) {
      throw new BadRequestException('حداقل یک تغییر برای کد تخفیف لازم است.');
    }

    const current = await this.database.prisma.coupon.findUnique({
      where: { id: couponId },
      select: adminCouponSelect,
    });
    if (!current) throw new NotFoundException('کد تخفیف پیدا نشد.');

    const activeFrom =
      input.activeFrom === undefined
        ? current.activeFrom
        : parseAdminDate(input.activeFrom, 'زمان شروع کد تخفیف معتبر نیست.');
    const activeUntil =
      input.activeUntil === undefined
        ? current.activeUntil
        : parseAdminDate(input.activeUntil, 'زمان پایان کد تخفیف معتبر نیست.');
    const next: CouponSource = {
      ...current,
      activeFrom,
      activeUntil,
      maxRedemptions:
        input.maxRedemptions === undefined ? current.maxRedemptions : input.maxRedemptions,
      perUserLimit: input.perUserLimit === undefined ? current.perUserLimit : input.perUserLimit,
      isActive: input.isActive === undefined ? current.isActive : input.isActive,
    };
    assertConfiguration(next);
    const expectedUpdatedAt = input.expectedUpdatedAt
      ? parseAdminDate(input.expectedUpdatedAt, 'زمان ویرایش کد تخفیف معتبر نیست.')
      : undefined;
    const data: Prisma.CouponUpdateManyMutationInput = {
      ...(input.activeFrom === undefined ? {} : { activeFrom }),
      ...(input.activeUntil === undefined ? {} : { activeUntil }),
      ...(input.maxRedemptions === undefined ? {} : { maxRedemptions: input.maxRedemptions }),
      ...(input.perUserLimit === undefined ? {} : { perUserLimit: input.perUserLimit }),
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    };
    const audit = this.requireAudit();
    const updated = await this.database.prisma.$transaction(async (transaction) => {
      const result = await transaction.coupon.updateMany({
        where: { id: couponId, ...(expectedUpdatedAt ? { updatedAt: expectedUpdatedAt } : {}) },
        data,
      });
      if (result.count !== 1) {
        throw new ConflictException('کد تخفیف هم‌زمان تغییر کرده است.');
      }
      const coupon = await transaction.coupon.findUnique({
        where: { id: couponId },
        select: adminCouponSelect,
      });
      if (!coupon) throw new NotFoundException('کد تخفیف پیدا نشد.');
      await audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'coupon.updated',
          resourceType: 'Coupon',
          resourceId: coupon.id,
          metadata: {
            code: coupon.code,
            changedFields: Object.keys(data),
          },
        },
        transaction,
      );
      return coupon;
    });

    return toAdminCouponView(updated, new Date());
  }

  private async findCoupon(database: CouponDatabase, codeInput: string): Promise<CouponSource> {
    const code = normalizeCode(codeInput);
    const coupon = await database.coupon.findUnique({ where: { code }, select: couponSelect });
    if (!coupon) throw new ConflictException('کد تخفیف معتبر نیست یا منقضی شده است.');
    return coupon;
  }

  private assertUsable(coupon: CouponSource, subtotalToman: number, now: Date): void {
    assertConfiguration(coupon);
    if (!isActive(coupon, now)) {
      throw new ConflictException('کد تخفیف معتبر نیست یا منقضی شده است.');
    }
    calculateDiscount(coupon, subtotalToman);
  }

  private requireAudit(): AuditService {
    if (!this.audit) {
      throw new ServiceUnavailableException('ثبت رویداد کد تخفیف هنوز پیکربندی نشده است.');
    }
    return this.audit;
  }

  private async assertRedemptionCapacity(
    database: CouponDatabase,
    coupon: CouponSource,
    userId: string,
    now: Date,
  ): Promise<void> {
    const activeWhere = {
      couponId: coupon.id,
      OR: [
        { status: 'COMMITTED' as const },
        { status: 'RESERVED' as const, reservedUntil: { gt: now } },
      ],
    } satisfies Prisma.PromotionRedemptionWhereInput;
    if (coupon.maxRedemptions !== null) {
      const total = await database.promotionRedemption.count({ where: activeWhere });
      if (total >= coupon.maxRedemptions) {
        throw new ConflictException('ظرفیت استفاده از کد تخفیف تکمیل شده است.');
      }
    }
    if (coupon.perUserLimit !== null) {
      const total = await database.promotionRedemption.count({
        where: { ...activeWhere, userId },
      });
      if (total >= coupon.perUserLimit) {
        throw new ConflictException('سقف استفاده شما از این کد تخفیف تکمیل شده است.');
      }
    }
  }
}
