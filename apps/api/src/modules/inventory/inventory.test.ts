import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { InventoryReservationStatus } from '@nova/db';

import {
  InventoryService,
  INVENTORY_RESERVATION_TTL_SECONDS,
  toInventoryReservationView,
} from './inventory.service';

type ReservationState = 'ACTIVE' | 'CONSUMED' | 'RELEASED' | 'EXPIRED';

interface FakeInventory {
  id: string;
  variantId: string;
  onHand: number;
  reserved: number;
}

interface FakeReservation {
  id: string;
  inventoryItemId: string;
  orderId: string | null;
  quantity: number;
  status: ReservationState;
  expiresAt: Date;
  releasedAt: Date | null;
}

interface FakeMovement {
  inventoryItemId: string;
  type: 'RESERVATION' | 'RELEASE' | 'SALE';
  quantity: number;
  reference: string | null;
}

interface FakeStore {
  inventories: Map<string, FakeInventory>;
  reservations: Map<string, FakeReservation>;
  movements: FakeMovement[];
  nextReservationId: number;
}

function cloneStore(source: FakeStore): FakeStore {
  return {
    inventories: new Map([...source.inventories].map(([key, value]) => [key, { ...value }])),
    reservations: new Map([...source.reservations].map(([key, value]) => [key, { ...value }])),
    movements: source.movements.map((movement) => ({ ...movement })),
    nextReservationId: source.nextReservationId,
  };
}

function commitStore(target: FakeStore, source: FakeStore): void {
  target.inventories = source.inventories;
  target.reservations = source.reservations;
  target.movements = source.movements;
  target.nextReservationId = source.nextReservationId;
}

function toReservationSource(store: FakeStore, reservation: FakeReservation) {
  const inventory = [...store.inventories.values()].find(
    (item) => item.id === reservation.inventoryItemId,
  );
  if (!inventory) throw new Error('missing fake inventory');
  return {
    id: reservation.id,
    inventoryItemId: reservation.inventoryItemId,
    orderId: reservation.orderId,
    quantity: reservation.quantity,
    status: reservation.status as InventoryReservationStatus,
    expiresAt: reservation.expiresAt,
    inventoryItem: { variantId: inventory.variantId },
  };
}

function createFakeService() {
  const state: FakeStore = {
    inventories: new Map([
      ['variant-1', { id: 'inventory-1', variantId: 'variant-1', onHand: 5, reserved: 0 }],
      ['variant-2', { id: 'inventory-2', variantId: 'variant-2', onHand: 1, reserved: 0 }],
    ]),
    reservations: new Map(),
    movements: [],
    nextReservationId: 1,
  };

  const makeClient = (store: FakeStore) => ({
    inventoryItem: {
      findUnique: async ({ where }: { where: { variantId: string } }) => {
        const inventory = store.inventories.get(where.variantId);
        return inventory ? { id: inventory.id } : null;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: {
          id: string;
          onHand?: { gte: number };
          reserved?: { gte: number };
        };
        data: {
          onHand?: { decrement: number };
          reserved?: { decrement: number };
        };
      }) => {
        const inventory = [...store.inventories.values()].find((item) => item.id === where.id);
        if (
          !inventory ||
          (where.onHand && inventory.onHand < where.onHand.gte) ||
          (where.reserved && inventory.reserved < where.reserved.gte)
        ) {
          return { count: 0 };
        }
        if (data.onHand) inventory.onHand -= data.onHand.decrement;
        if (data.reserved) inventory.reserved -= data.reserved.decrement;
        return { count: 1 };
      },
    },
    productVariant: {
      findFirst: async ({
        where,
      }: {
        where: { id: string; isActive: true; product: { status: 'PUBLISHED'; archivedAt: null } };
        select: { id: true };
      }) => (store.inventories.has(where.id) ? { id: where.id } : null),
    },
    inventoryReservation: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const reservation = store.reservations.get(where.id);
        return reservation ? toReservationSource(store, reservation) : null;
      },
      create: async ({
        data,
      }: {
        data: {
          inventoryItemId: string;
          orderId: string | null;
          quantity: number;
          status: ReservationState;
          expiresAt: Date;
        };
      }) => {
        const reservation: FakeReservation = {
          id: `reservation-${store.nextReservationId++}`,
          inventoryItemId: data.inventoryItemId,
          orderId: data.orderId,
          quantity: data.quantity,
          status: data.status,
          expiresAt: data.expiresAt,
          releasedAt: null,
        };
        store.reservations.set(reservation.id, reservation);
        return toReservationSource(store, reservation);
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: {
          id: string;
          status?: ReservationState;
          orderId?: string | null;
        };
        data: {
          status?: ReservationState;
          orderId?: string;
          releasedAt?: Date | null;
        };
      }) => {
        const reservation = store.reservations.get(where.id);
        if (
          !reservation ||
          (where.status !== undefined && reservation.status !== where.status) ||
          (where.orderId !== undefined && reservation.orderId !== where.orderId)
        ) {
          return { count: 0 };
        }
        if (data.status) reservation.status = data.status;
        if (data.orderId !== undefined) reservation.orderId = data.orderId;
        if (data.releasedAt !== undefined) reservation.releasedAt = data.releasedAt;
        return { count: 1 };
      },
      findMany: async ({
        where,
        orderBy,
        take,
        select,
      }: {
        where: {
          status?: ReservationState;
          expiresAt?: { lte: Date };
          orderId?: string | null;
        };
        orderBy: { expiresAt?: 'asc'; createdAt?: 'asc' };
        take?: number;
        select: {
          id: boolean;
          inventoryItemId?: boolean;
          orderId?: boolean;
          quantity?: boolean;
          status?: boolean;
          expiresAt?: boolean;
          inventoryItem?: unknown;
        };
      }) => {
        const filtered = [...store.reservations.values()]
          .filter(
            (reservation) =>
              (where.status === undefined || reservation.status === where.status) &&
              (where.expiresAt === undefined || reservation.expiresAt <= where.expiresAt.lte) &&
              (where.orderId === undefined || reservation.orderId === where.orderId),
          )
          .sort((left, right) => {
            if (orderBy.expiresAt) return left.expiresAt.getTime() - right.expiresAt.getTime();
            return left.id.localeCompare(right.id);
          })
          .slice(0, take ?? Number.MAX_SAFE_INTEGER);

        return filtered.map((reservation) =>
          select.inventoryItem ? toReservationSource(store, reservation) : { id: reservation.id },
        );
      },
    },
    stockMovement: {
      create: async ({ data }: { data: FakeMovement }) => {
        store.movements.push({ ...data });
        return { id: `movement-${store.movements.length}` };
      },
    },
    $queryRaw: async <T>(query: unknown): Promise<T> => {
      const values = (query as { values?: unknown[] }).values ?? [];
      const quantity = Number(values[0]);
      const inventoryId = String(values[1]);
      const inventory = [...store.inventories.values()].find((item) => item.id === inventoryId);
      if (!inventory || inventory.onHand - inventory.reserved < quantity) return [] as T;
      inventory.reserved += quantity;
      return [{ id: inventory.id }] as T;
    },
  });

  const prisma = {
    inventoryReservation: makeClient(state).inventoryReservation,
    $transaction: async <T>(
      callback: (transaction: ReturnType<typeof makeClient>) => Promise<T>,
    ) => {
      const working = cloneStore(state);
      const result = await callback(makeClient(working));
      commitStore(state, working);
      return result;
    },
  };

  return { service: new InventoryService({ prisma } as never), state };
}

test('reserves multiple lines atomically and records reservation movements', async () => {
  const { service, state } = createFakeService();

  const batch = await service.reserve({
    lines: [
      { variantId: 'variant-1', quantity: 2 },
      { variantId: 'variant-2', quantity: 1 },
    ],
  });

  assert.equal(batch.reservations.length, 2);
  assert.equal(state.inventories.get('variant-1')?.reserved, 2);
  assert.equal(state.inventories.get('variant-2')?.reserved, 1);
  assert.equal(state.movements.length, 2);
  assert.deepEqual(
    state.movements.map((movement) => [movement.type, movement.quantity]),
    [
      ['RESERVATION', 2],
      ['RESERVATION', 1],
    ],
  );
  assert.ok(
    batch.expiresAt.getTime() >= Date.now() + (INVENTORY_RESERVATION_TTL_SECONDS - 2) * 1_000,
  );
});

test('rolls back every line when one variant lacks enough stock', async () => {
  const { service, state } = createFakeService();

  await assert.rejects(
    service.reserve({
      lines: [
        { variantId: 'variant-1', quantity: 2 },
        { variantId: 'variant-2', quantity: 2 },
      ],
    }),
    /کافی نیست/,
  );

  assert.equal(state.inventories.get('variant-1')?.reserved, 0);
  assert.equal(state.reservations.size, 0);
  assert.equal(state.movements.length, 0);
});

test('attaches orders and makes release transitions idempotent', async () => {
  const { service, state } = createFakeService();
  const [reservation] = (
    await service.reserve({
      lines: [{ variantId: 'variant-1', quantity: 2 }],
    })
  ).reservations;
  assert.ok(reservation);

  const attached = await service.attachToOrder(reservation.id, 'order-1');
  const released = await service.release(reservation.id);
  const repeated = await service.release(reservation.id);

  assert.equal(attached.orderId, 'order-1');
  assert.equal(released.status, 'RELEASED');
  assert.equal(repeated.status, 'RELEASED');
  assert.equal(state.inventories.get('variant-1')?.reserved, 0);
  assert.equal(state.movements.length, 2);
  await assert.rejects(service.consume(reservation.id), /قابل تغییر نیست/);
});

test('consumption decrements physical and reserved stock once', async () => {
  const { service, state } = createFakeService();
  const [reservation] = (
    await service.reserve({
      lines: [{ variantId: 'variant-1', quantity: 2 }],
    })
  ).reservations;
  assert.ok(reservation);

  const consumed = await service.consume(reservation.id);
  const repeated = await service.consume(reservation.id);

  assert.equal(consumed.status, 'CONSUMED');
  assert.equal(repeated.status, 'CONSUMED');
  assert.equal(state.inventories.get('variant-1')?.onHand, 3);
  assert.equal(state.inventories.get('variant-1')?.reserved, 0);
  assert.equal(state.movements.filter((movement) => movement.type === 'SALE').length, 1);
  assert.equal(state.movements.at(-1)?.quantity, -2);
});

test('consumes every active reservation for a paid order', async () => {
  const { service, state } = createFakeService();
  const [reservation] = (
    await service.reserve({
      orderId: 'order-1',
      lines: [{ variantId: 'variant-1', quantity: 2 }],
    })
  ).reservations;
  assert.ok(reservation);

  const settlement = await service.consumeForOrder('order-1');

  assert.equal(settlement, 'CONSUMED');
  assert.equal(state.reservations.get(reservation.id)?.status, 'CONSUMED');
  assert.equal(state.inventories.get('variant-1')?.onHand, 3);
  assert.equal(state.inventories.get('variant-1')?.reserved, 0);
});

test('releases expired order reservations for late-payment reacquisition', async () => {
  const { service, state } = createFakeService();
  const [reservation] = (
    await service.reserve({
      orderId: 'order-1',
      lines: [{ variantId: 'variant-1', quantity: 2 }],
    })
  ).reservations;
  assert.ok(reservation);

  const settlement = await service.consumeForOrder(
    'order-1',
    new Date(reservation.expiresAt.getTime() + 1),
  );

  assert.equal(settlement, 'REACQUIRE_REQUIRED');
  assert.equal(state.reservations.get(reservation.id)?.status, 'EXPIRED');
  assert.equal(state.inventories.get('variant-1')?.reserved, 0);
});

test('expiry processes due reservations and leaves future reservations active', async () => {
  const { service, state } = createFakeService();
  const [reservation] = (
    await service.reserve({
      lines: [{ variantId: 'variant-1', quantity: 1 }],
    })
  ).reservations;
  assert.ok(reservation);
  const beforeDue = new Date(reservation.expiresAt.getTime() - 1);
  await assert.rejects(service.expire(reservation.id), /هنوز تمام نشده/);

  const expired = await service.expireDue(new Date(reservation.expiresAt.getTime() + 1));
  assert.equal(expired, 1);
  assert.equal(state.reservations.get(reservation.id)?.status, 'EXPIRED');
  assert.equal(state.inventories.get('variant-1')?.reserved, 0);
  assert.equal(state.movements.at(-1)?.type, 'RELEASE');
  assert.ok(beforeDue < reservation.expiresAt);
});

test('rejects duplicate variants and invalid quantities before opening a transaction', async () => {
  const { service } = createFakeService();

  await assert.rejects(
    service.reserve({
      lines: [
        { variantId: 'variant-1', quantity: 1 },
        { variantId: 'variant-1', quantity: 1 },
      ],
    }),
    /فقط یک‌بار/,
  );
  await assert.rejects(
    service.reserve({ lines: [{ variantId: 'variant-1', quantity: 0 }] }),
    /صحیح مثبت/,
  );
});

test('serializes reservation views without exposing inventory quantities', () => {
  const source = {
    id: 'reservation-1',
    inventoryItemId: 'inventory-1',
    orderId: null,
    quantity: 2,
    status: 'ACTIVE' as InventoryReservationStatus,
    expiresAt: new Date('2026-09-08T12:00:00.000Z'),
    inventoryItem: { variantId: 'variant-1' },
  };
  const view = toInventoryReservationView(source);

  assert.equal(view.variantId, 'variant-1');
  assert.equal(Object.hasOwn(view, 'onHand'), false);
  assert.equal(Object.hasOwn(view, 'reserved'), false);
});
