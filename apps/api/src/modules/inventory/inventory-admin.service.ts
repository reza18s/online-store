import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@nova/db';
import type { ProductStatus, StockMovementType } from '@nova/db';

import { DatabaseService } from '../../database/database.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { assertStaffRole } from '../staff-auth/staff-auth.guard';
import type {
  AdminInventoryAdjustmentDto,
  AdminInventoryReorderPointDto,
} from './dto/admin-inventory.dto';
import {
  AdminInventoryListQueryDto,
  type AdminInventoryVariantStatus,
} from './dto/admin-inventory.query';

const INVENTORY_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const POSTGRES_INT_MAX = 2_147_483_647;
const MAX_REASON_LENGTH = 240;
const RECENT_MOVEMENT_LIMIT = 20;

const inventoryItemSelect = {
  id: true,
  variantId: true,
  onHand: true,
  reserved: true,
  reorderPoint: true,
  updatedAt: true,
  variant: {
    select: {
      id: true,
      productId: true,
      sku: true,
      title: true,
      isActive: true,
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
        },
      },
    },
  },
} as const;

const inventoryDetailSelect = {
  ...inventoryItemSelect,
  stockMovements: {
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: RECENT_MOVEMENT_LIMIT,
    select: {
      id: true,
      type: true,
      quantity: true,
      reference: true,
      createdAt: true,
    },
  },
} satisfies Prisma.InventoryItemSelect;

interface InventorySource {
  id: string;
  variantId: string;
  onHand: number;
  reserved: number;
  reorderPoint: number;
  updatedAt: Date;
  variant: {
    id: string;
    productId: string;
    sku: string;
    title: string | null;
    isActive: boolean;
    product: {
      id: string;
      slug: string;
      name: string;
      status: ProductStatus;
    };
  };
}

interface InventoryDetailSource extends InventorySource {
  stockMovements: Array<{
    id: string;
    type: StockMovementType;
    quantity: number;
    reference: string | null;
    createdAt: Date;
  }>;
}

export type AdminInventoryStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface AdminInventoryMovementView {
  id: string;
  type: StockMovementType;
  quantity: number;
  reference: string | null;
  createdAt: Date;
}

export interface AdminInventoryItemView {
  id: string;
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  productStatus: ProductStatus;
  sku: string;
  variantTitle: string | null;
  isActive: boolean;
  onHand: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  stockStatus: AdminInventoryStockStatus;
  updatedAt: Date;
  recentMovements?: AdminInventoryMovementView[];
}

export interface AdminInventoryPage {
  items: AdminInventoryItemView[];
  total: number;
  page: number;
  limit: number;
}

function assertVariantId(value: string): void {
  if (!INVENTORY_ID_PATTERN.test(value)) {
    throw new BadRequestException('شناسه تنوع کالا معتبر نیست.');
  }
}

function assertListBounds(query: AdminInventoryListQueryDto): { page: number; limit: number } {
  const page = query.page ?? 1;
  const limit = query.limit ?? 24;
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000) {
    throw new BadRequestException('شماره صفحه موجودی معتبر نیست.');
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException('اندازه صفحه موجودی معتبر نیست.');
  }
  return { page, limit };
}

function parseExpectedUpdatedAt(value: string | undefined): Date | undefined {
  if (value === undefined) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('زمان آخرین ویرایش موجودی معتبر نیست.');
  }
  return parsed;
}

function normalizeReason(value: string): string {
  const reason = value.trim();
  if (!reason || reason.length > MAX_REASON_LENGTH) {
    throw new BadRequestException('علت تغییر موجودی الزامی و حداکثر ۲۴۰ نویسه است.');
  }
  return reason;
}

function toStockStatus(available: number, reorderPoint: number): AdminInventoryStockStatus {
  if (available <= 0) return 'OUT_OF_STOCK';
  if (available <= reorderPoint) return 'LOW_STOCK';
  return 'IN_STOCK';
}

function toInventoryView(source: InventorySource | InventoryDetailSource): AdminInventoryItemView {
  const available = Math.max(0, source.onHand - source.reserved);
  const view: AdminInventoryItemView = {
    id: source.id,
    variantId: source.variantId,
    productId: source.variant.productId,
    productSlug: source.variant.product.slug,
    productName: source.variant.product.name,
    productStatus: source.variant.product.status,
    sku: source.variant.sku,
    variantTitle: source.variant.title,
    isActive: source.variant.isActive,
    onHand: source.onHand,
    reserved: source.reserved,
    available,
    reorderPoint: source.reorderPoint,
    stockStatus: toStockStatus(available, source.reorderPoint),
    updatedAt: source.updatedAt,
  };

  if ('stockMovements' in source) {
    view.recentMovements = source.stockMovements.map((movement) => ({ ...movement }));
  }
  return view;
}

function inventoryWhere(query: AdminInventoryListQueryDto): Prisma.InventoryItemWhereInput {
  const where: Prisma.InventoryItemWhereInput = {};
  const status: AdminInventoryVariantStatus = query.status ?? 'ALL';

  if (status !== 'ALL') {
    where.variant = { isActive: status === 'ACTIVE' };
  }

  if (query.q) {
    where.OR = [
      { variant: { sku: { contains: query.q, mode: 'insensitive' } } },
      { variant: { title: { contains: query.q, mode: 'insensitive' } } },
      { variant: { product: { name: { contains: query.q, mode: 'insensitive' } } } },
      { variant: { product: { searchText: { contains: query.q, mode: 'insensitive' } } } },
    ];
  }

  return where;
}

@Injectable()
export class InventoryAdminService {
  public constructor(
    private readonly database: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  public async listInventory(
    staff: AuthenticatedStaff,
    query: AdminInventoryListQueryDto,
  ): Promise<AdminInventoryPage> {
    assertStaffRole(staff, 'support', 'operations', 'admin');
    const { page, limit } = assertListBounds(query);
    const skip = (page - 1) * limit;

    if (query.lowStock === true) {
      return this.listLowStock(staff, query, page, limit, skip);
    }

    const where = inventoryWhere(query);
    const [total, items] = await Promise.all([
      this.database.prisma.inventoryItem.count({ where }),
      this.database.prisma.inventoryItem.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip,
        take: limit,
        select: inventoryItemSelect,
      }),
    ]);

    return {
      items: items.map((item) => toInventoryView(item)),
      total,
      page,
      limit,
    };
  }

  public async getInventory(
    staff: AuthenticatedStaff,
    variantId: string,
  ): Promise<AdminInventoryItemView> {
    assertStaffRole(staff, 'support', 'operations', 'admin');
    assertVariantId(variantId);
    const item = await this.database.prisma.inventoryItem.findUnique({
      where: { variantId },
      select: inventoryDetailSelect,
    });
    if (!item) throw new NotFoundException('موجودی تنوع کالا پیدا نشد.');
    return toInventoryView(item);
  }

  public async adjustInventory(
    staff: AuthenticatedStaff,
    variantId: string,
    input: AdminInventoryAdjustmentDto,
  ): Promise<AdminInventoryItemView> {
    assertStaffRole(staff, 'operations', 'admin');
    assertVariantId(variantId);
    const reason = normalizeReason(input.reason);
    const delta = input.delta;
    if (!Number.isSafeInteger(delta) || delta === 0 || Math.abs(delta) > POSTGRES_INT_MAX) {
      throw new BadRequestException('مقدار تغییر موجودی باید عدد صحیح غیرصفر باشد.');
    }
    const expectedUpdatedAt = parseExpectedUpdatedAt(input.expectedUpdatedAt);

    const updated = await this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.inventoryItem.findUnique({
        where: { variantId },
        select: inventoryItemSelect,
      });
      if (!current) throw new NotFoundException('موجودی تنوع کالا پیدا نشد.');
      if (expectedUpdatedAt && current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        throw new ConflictException('موجودی از زمان دریافت فرم تغییر کرده است.');
      }

      const nextOnHand = current.onHand + delta;
      if (nextOnHand < current.reserved) {
        throw new ConflictException('موجودی فیزیکی نمی‌تواند کمتر از موجودی رزروشده باشد.');
      }
      if (nextOnHand > POSTGRES_INT_MAX) {
        throw new BadRequestException('موجودی از ظرفیت مجاز بیشتر می‌شود.');
      }

      const updatedRows = await transaction.inventoryItem.updateMany({
        where: {
          id: current.id,
          onHand: current.onHand,
          reserved: current.reserved,
          updatedAt: current.updatedAt,
        },
        data: { onHand: { increment: delta } },
      });
      if (updatedRows.count !== 1) {
        throw new ConflictException('موجودی هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.');
      }

      const result = await transaction.inventoryItem.findUnique({
        where: { variantId },
        select: inventoryDetailSelect,
      });
      if (!result) throw new NotFoundException('موجودی تنوع کالا پیدا نشد.');

      await transaction.stockMovement.create({
        data: {
          inventoryItemId: current.id,
          type: 'ADJUSTMENT',
          quantity: delta,
          reference: `staff-adjustment:${staff.id}`,
        },
      });
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'inventory.stock.adjusted',
          resourceType: 'InventoryItem',
          resourceId: current.id,
          metadata: {
            variantId,
            sku: current.variant.sku,
            delta,
            reason,
            previousOnHand: current.onHand,
            onHand: result.onHand,
            reserved: result.reserved,
          },
        },
        transaction,
      );
      return result;
    });

    return toInventoryView(updated);
  }

  public async updateReorderPoint(
    staff: AuthenticatedStaff,
    variantId: string,
    input: AdminInventoryReorderPointDto,
  ): Promise<AdminInventoryItemView> {
    assertStaffRole(staff, 'operations', 'admin');
    assertVariantId(variantId);
    const reorderPoint = input.reorderPoint;
    if (
      !Number.isSafeInteger(reorderPoint) ||
      reorderPoint < 0 ||
      reorderPoint > POSTGRES_INT_MAX
    ) {
      throw new BadRequestException('نقطه سفارش مجدد موجودی معتبر نیست.');
    }
    const expectedUpdatedAt = parseExpectedUpdatedAt(input.expectedUpdatedAt);

    const updated = await this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.inventoryItem.findUnique({
        where: { variantId },
        select: inventoryItemSelect,
      });
      if (!current) throw new NotFoundException('موجودی تنوع کالا پیدا نشد.');
      if (expectedUpdatedAt && current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        throw new ConflictException('موجودی از زمان دریافت فرم تغییر کرده است.');
      }

      const updatedRows = await transaction.inventoryItem.updateMany({
        where: {
          id: current.id,
          reorderPoint: current.reorderPoint,
          updatedAt: current.updatedAt,
        },
        data: { reorderPoint },
      });
      if (updatedRows.count !== 1) {
        throw new ConflictException('موجودی هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.');
      }

      const result = await transaction.inventoryItem.findUnique({
        where: { variantId },
        select: inventoryDetailSelect,
      });
      if (!result) throw new NotFoundException('موجودی تنوع کالا پیدا نشد.');

      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'inventory.reorder_point.updated',
          resourceType: 'InventoryItem',
          resourceId: current.id,
          metadata: {
            variantId,
            sku: current.variant.sku,
            previousReorderPoint: current.reorderPoint,
            reorderPoint,
          },
        },
        transaction,
      );
      return result;
    });

    return toInventoryView(updated);
  }

  private async listLowStock(
    _staff: AuthenticatedStaff,
    query: AdminInventoryListQueryDto,
    page: number,
    limit: number,
    skip: number,
  ): Promise<AdminInventoryPage> {
    const status = query.status ?? 'ALL';
    const statusClause =
      status === 'ACTIVE'
        ? Prisma.sql`AND v."isActive" = true`
        : status === 'INACTIVE'
          ? Prisma.sql`AND v."isActive" = false`
          : Prisma.sql``;
    const searchClause = query.q
      ? Prisma.sql`AND (
          lower(v."sku") ILIKE '%' || lower(${query.q}) || '%'
          OR lower(coalesce(v."title", '')) ILIKE '%' || lower(${query.q}) || '%'
          OR lower(p."name") ILIKE '%' || lower(${query.q}) || '%'
          OR lower(coalesce(p."searchText", '')) ILIKE '%' || lower(${query.q}) || '%'
        )`
      : Prisma.sql``;
    const filteredFromWhere = Prisma.sql`
      FROM "InventoryItem" i
      INNER JOIN "ProductVariant" v ON v."id" = i."variantId"
      INNER JOIN "Product" p ON p."id" = v."productId"
      WHERE i."onHand" - i."reserved" <= i."reorderPoint"
        ${statusClause}
        ${searchClause}
    `;
    const [countRows, rows] = await Promise.all([
      this.database.prisma.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
        SELECT COUNT(*) AS "total"
        ${filteredFromWhere}
      `),
      this.database.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT i."id"
        ${filteredFromWhere}
        ORDER BY i."updatedAt" DESC, i."id" ASC
        LIMIT ${limit}
        OFFSET ${skip}
      `),
    ]);
    const total = Number(countRows[0]?.total ?? 0);
    const ids = rows.map((row) => row.id);
    if (ids.length === 0) return { items: [], total, page, limit };

    const items = await this.database.prisma.inventoryItem.findMany({
      where: { id: { in: ids } },
      select: inventoryItemSelect,
    });
    const order = new Map(ids.map((id, index) => [id, index]));
    items.sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
    return {
      items: items.map((item) => toInventoryView(item)),
      total,
      page,
      limit,
    };
  }
}
