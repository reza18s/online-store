import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ForbiddenException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { InventoryAdminService } from './inventory-admin.service';
import {
  AdminInventoryAdjustmentDto,
  AdminInventoryReorderPointDto,
} from './dto/admin-inventory.dto';

interface FakeState {
  inventory: {
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
        status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      };
    };
    stockMovements: Array<{
      id: string;
      type: 'ADJUSTMENT';
      quantity: number;
      reference: string | null;
      createdAt: Date;
    }>;
  };
  audits: Array<Record<string, unknown>>;
}

function createStaff(roles: AuthenticatedStaff['roles']): AuthenticatedStaff {
  return {
    id: 'staff-1',
    email: 'operations@nova.test',
    status: 'ACTIVE',
    roles,
  };
}

function createState(): FakeState {
  return {
    inventory: {
      id: 'inventory-1',
      variantId: 'variant-1',
      onHand: 5,
      reserved: 2,
      reorderPoint: 4,
      updatedAt: new Date('2026-09-08T08:00:00.000Z'),
      variant: {
        id: 'variant-1',
        productId: 'product-1',
        sku: 'NOVA-LINEN-001-M',
        title: 'کرم / M',
        isActive: true,
        product: {
          id: 'product-1',
          slug: 'linen-overshirt',
          name: 'مانتوی لینن کمربندی آوا',
          status: 'PUBLISHED',
        },
      },
      stockMovements: [],
    },
    audits: [],
  };
}

function cloneState(source: FakeState): FakeState {
  return {
    inventory: {
      ...source.inventory,
      updatedAt: new Date(source.inventory.updatedAt),
      variant: { ...source.inventory.variant, product: { ...source.inventory.variant.product } },
      stockMovements: source.inventory.stockMovements.map((movement) => ({
        ...movement,
        createdAt: new Date(movement.createdAt),
      })),
    },
    audits: source.audits.map((audit) => ({ ...audit })),
  };
}

function createService() {
  const state = createState();
  const makeClient = (store: FakeState) => ({
    inventoryItem: {
      findUnique: async () => cloneState(store).inventory,
      count: async () => 1,
      findMany: async () => [cloneState(store).inventory],
      updateMany: async ({
        where,
        data,
      }: {
        where: {
          id: string;
          onHand?: number;
          reserved?: number;
          reorderPoint?: number;
          updatedAt: Date;
        };
        data: {
          onHand?: { increment: number };
          reorderPoint?: number;
        };
      }) => {
        const inventory = store.inventory;
        if (
          inventory.id !== where.id ||
          inventory.updatedAt.getTime() !== where.updatedAt.getTime() ||
          (where.onHand !== undefined && inventory.onHand !== where.onHand) ||
          (where.reserved !== undefined && inventory.reserved !== where.reserved) ||
          (where.reorderPoint !== undefined && inventory.reorderPoint !== where.reorderPoint)
        ) {
          return { count: 0 };
        }
        if (data.onHand) inventory.onHand += data.onHand.increment;
        if (data.reorderPoint !== undefined) inventory.reorderPoint = data.reorderPoint;
        inventory.updatedAt = new Date('2026-09-08T08:30:00.000Z');
        return { count: 1 };
      },
    },
    stockMovement: {
      create: async ({ data }: { data: FakeState['inventory']['stockMovements'][number] }) => {
        store.inventory.stockMovements.push({
          ...data,
          id: `movement-${store.inventory.stockMovements.length + 1}`,
          createdAt: new Date('2026-09-08T08:30:00.000Z'),
        });
        return { id: store.inventory.stockMovements.at(-1)?.id };
      },
    },
    auditEvent: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        store.audits.push(data);
        return { id: `audit-${store.audits.length}` };
      },
    },
  });

  const prisma = {
    ...makeClient(state),
    $transaction: async <T>(
      callback: (transaction: ReturnType<typeof makeClient>) => Promise<T>,
    ) => {
      const working = cloneState(state);
      const result = await callback(makeClient(working));
      state.inventory = working.inventory;
      state.audits = working.audits;
      return result;
    },
  };
  const audit = new AuditService({ prisma } as never);
  return { service: new InventoryAdminService({ prisma } as never, audit), state };
}

test('adjusts on-hand stock atomically and records a staff audit', async () => {
  const { service, state } = createService();
  const input = Object.assign(new AdminInventoryAdjustmentDto(), {
    delta: 3,
    reason: '  رسید انبار  ',
    expectedUpdatedAt: state.inventory.updatedAt.toISOString(),
  });

  const result = await service.adjustInventory(createStaff(['operations']), 'variant-1', input);

  assert.equal(result.onHand, 8);
  assert.equal(result.reserved, 2);
  assert.equal(result.available, 6);
  assert.equal(state.inventory.stockMovements[0]?.quantity, 3);
  assert.equal(state.audits[0]?.action, 'inventory.stock.adjusted');
  assert.deepEqual(state.audits[0]?.metadata, {
    variantId: 'variant-1',
    sku: 'NOVA-LINEN-001-M',
    delta: 3,
    reason: 'رسید انبار',
    previousOnHand: 5,
    onHand: 8,
    reserved: 2,
  });
});

test('does not allow an adjustment below reserved stock', async () => {
  const { service, state } = createService();
  const input = Object.assign(new AdminInventoryAdjustmentDto(), {
    delta: -4,
    reason: 'اصلاح شمارش',
  });

  await assert.rejects(
    service.adjustInventory(createStaff(['admin']), 'variant-1', input),
    /کمتر از موجودی رزروشده/,
  );
  assert.equal(state.inventory.onHand, 5);
  assert.equal(state.inventory.stockMovements.length, 0);
  assert.equal(state.audits.length, 0);
});

test('rejects staff without an inventory mutation role', async () => {
  const { service } = createService();
  const input = Object.assign(new AdminInventoryAdjustmentDto(), {
    delta: 1,
    reason: 'رسید',
  });

  await assert.rejects(
    service.adjustInventory(createStaff(['support']), 'variant-1', input),
    (error: unknown) => error instanceof ForbiddenException,
  );
});

test('updates reorder points with optimistic concurrency and an audit', async () => {
  const { service, state } = createService();
  const input = Object.assign(new AdminInventoryReorderPointDto(), {
    reorderPoint: 7,
    expectedUpdatedAt: state.inventory.updatedAt.toISOString(),
  });

  const result = await service.updateReorderPoint(createStaff(['operations']), 'variant-1', input);

  assert.equal(result.reorderPoint, 7);
  assert.equal(result.stockStatus, 'LOW_STOCK');
  assert.equal(state.audits[0]?.action, 'inventory.reorder_point.updated');
});
