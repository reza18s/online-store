import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ConflictException } from '@nestjs/common';

import { CartService, hashCartToken } from './cart.service';

interface FakeItem {
  id: string;
  variantId: string;
  quantity: number;
  availability?: {
    isActive?: boolean;
    productStatus?: string;
    archivedAt?: Date | null;
    onHand?: number | null;
    reserved?: number;
  };
}

interface FakeCart {
  id: string;
  tokenHash: string;
  kind: 'GUEST' | 'CUSTOMER';
  expiresAt: Date | null;
  items: FakeItem[];
}

interface FakeStore {
  carts: Map<string, FakeCart>;
  ownerships: Array<{ cartId: string; userId: string | null }>;
  nextCartId: number;
  nextItemId: number;
}

function cloneStore(source: FakeStore): FakeStore {
  return {
    carts: new Map(
      [...source.carts].map(([key, value]) => [
        key,
        {
          ...value,
          expiresAt: value.expiresAt ? new Date(value.expiresAt) : null,
          items: value.items.map((item) => ({ ...item })),
        },
      ]),
    ),
    ownerships: source.ownerships.map((ownership) => ({ ...ownership })),
    nextCartId: source.nextCartId,
    nextItemId: source.nextItemId,
  };
}

function commitStore(target: FakeStore, source: FakeStore): void {
  target.carts = source.carts;
  target.ownerships = source.ownerships;
  target.nextCartId = source.nextCartId;
  target.nextItemId = source.nextItemId;
}

function cartSource(cart: FakeCart) {
  return {
    id: cart.id,
    kind: cart.kind,
    items: cart.items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      quantity: item.quantity,
      variant: {
        id: item.variantId,
        sku: item.variantId.toUpperCase(),
        title: null,
        priceToman: null,
        compareAtPriceToman: null,
        isActive: true,
        inventory: { onHand: 10, reserved: 0 },
        product: {
          id: `product-${item.variantId}`,
          slug: item.variantId,
          name: `محصول ${item.variantId}`,
          status: 'PUBLISHED',
          archivedAt: null,
          basePriceToman: 100_000,
          compareAtPriceToman: null,
          media: [{ url: `/images/${item.variantId}.webp`, altText: `تصویر ${item.variantId}` }],
        },
      },
    })),
  };
}

function createCartService(initialGuestItems: FakeItem[], initialCustomerItems: FakeItem[] = []) {
  const state: FakeStore = {
    carts: new Map([
      [
        'guest-1',
        {
          id: 'guest-1',
          tokenHash: hashCartToken('guest-token'),
          kind: 'GUEST',
          expiresAt: new Date(Date.now() + 60_000),
          items: initialGuestItems,
        },
      ],
      [
        'customer-1',
        {
          id: 'customer-1',
          tokenHash: hashCartToken('customer-internal-token'),
          kind: 'CUSTOMER',
          expiresAt: null,
          items: initialCustomerItems,
        },
      ],
    ]),
    ownerships: initialCustomerItems.length > 0 ? [{ cartId: 'customer-1', userId: 'user-1' }] : [],
    nextCartId: 2,
    nextItemId: Math.max(1, initialGuestItems.length + initialCustomerItems.length + 1),
  };

  const makeClient = (store: FakeStore) => ({
    $executeRaw: async () => 0,
    cartOwnership: {
      findFirst: async ({ where }: { where: { userId: string } }) => {
        const ownership = store.ownerships.find((candidate) => candidate.userId === where.userId);
        return ownership ? { cartId: ownership.cartId } : null;
      },
      create: async ({ data }: { data: { cartId: string; userId: string } }) => {
        store.ownerships.push({ cartId: data.cartId, userId: data.userId });
        return data;
      },
    },
    cart: {
      create: async ({ data }: { data: { tokenHash: string; kind: 'CUSTOMER' } }) => {
        const id = `customer-${store.nextCartId++}`;
        store.carts.set(id, {
          id,
          tokenHash: data.tokenHash,
          kind: data.kind,
          expiresAt: null,
          items: [],
        });
        return { id };
      },
      findUnique: async ({ where }: { where: { id: string; kind?: 'CUSTOMER' } }) => {
        const cart = store.carts.get(where.id);
        if (!cart || (where.kind && cart.kind !== where.kind)) return null;
        return cartSource(cart);
      },
      findFirst: async ({ where }: { where: { tokenHash: string; kind: 'GUEST' } }) => {
        const cart = [...store.carts.values()].find(
          (candidate) => candidate.tokenHash === where.tokenHash && candidate.kind === where.kind,
        );
        if (!cart) return null;
        return {
          id: cart.id,
          expiresAt: cart.expiresAt,
          items: cart.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            variant: {
              isActive: item.availability?.isActive ?? true,
              inventory:
                item.availability?.onHand === null
                  ? null
                  : {
                      onHand: item.availability?.onHand ?? 10,
                      reserved: item.availability?.reserved ?? 0,
                    },
              product: {
                status: item.availability?.productStatus ?? 'PUBLISHED',
                archivedAt: item.availability?.archivedAt ?? null,
              },
            },
          })),
        };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        store.carts.delete(where.id);
        return { id: where.id };
      },
    },
    cartItem: {
      update: async ({ where, data }: { where: { id: string }; data: { quantity: number } }) => {
        for (const cart of store.carts.values()) {
          const item = cart.items.find((candidate) => candidate.id === where.id);
          if (item) {
            item.quantity = data.quantity;
            return item;
          }
        }
        throw new Error('missing fake cart item');
      },
      create: async ({
        data,
      }: {
        data: { cartId: string; variantId: string; quantity: number };
      }) => {
        const cart = store.carts.get(data.cartId);
        if (!cart) throw new Error('missing fake cart');
        const item = {
          id: `item-${store.nextItemId++}`,
          variantId: data.variantId,
          quantity: data.quantity,
        };
        cart.items.push(item);
        return item;
      },
    },
  });

  const prisma = {
    ...makeClient(state),
    $transaction: async <T>(
      callback: (transaction: ReturnType<typeof makeClient>) => Promise<T>,
    ) => {
      const working = cloneStore(state);
      const result = await callback(makeClient(working));
      commitStore(state, working);
      return result;
    },
  };

  return { service: new CartService({ prisma } as never), state };
}

test('merges a guest cart into one customer cart and removes the guest token source', async () => {
  const { service, state } = createCartService(
    [
      { id: 'guest-item-1', variantId: 'variant-1', quantity: 3 },
      { id: 'guest-item-2', variantId: 'variant-2', quantity: 1 },
    ],
    [{ id: 'customer-item-1', variantId: 'variant-1', quantity: 2 }],
  );

  const cart = await service.mergeGuestIntoCustomer('guest-token', 'user-1');

  assert.equal(cart.kind, 'CUSTOMER');
  assert.equal(cart.itemCount, 6);
  assert.equal(cart.items.find((item) => item.variantId === 'variant-1')?.quantity, 5);
  assert.equal(cart.items.find((item) => item.variantId === 'variant-2')?.quantity, 1);
  assert.equal(state.carts.has('guest-1'), false);
  assert.deepEqual(state.ownerships, [{ cartId: 'customer-1', userId: 'user-1' }]);
});

test('rolls back customer-cart creation and leaves the guest cart when merge exceeds the line limit', async () => {
  const { service, state } = createCartService(
    [{ id: 'guest-item-1', variantId: 'variant-1', quantity: 1 }],
    [{ id: 'customer-item-1', variantId: 'variant-1', quantity: 99 }],
  );

  await assert.rejects(
    service.mergeGuestIntoCustomer('guest-token', 'user-1'),
    (error: unknown) => error instanceof ConflictException,
  );
  assert.equal(state.carts.has('guest-1'), true);
  assert.equal(state.ownerships.length, 1);
  assert.equal(state.carts.get('customer-1')?.items[0]?.quantity, 99);
});

test('returns structured merge conflicts and preserves both carts when guest stock is stale', async () => {
  const { service, state } = createCartService([
    {
      id: 'guest-item-1',
      variantId: 'variant-1',
      quantity: 2,
      availability: { onHand: 1 },
    },
    {
      id: 'guest-item-2',
      variantId: 'variant-2',
      quantity: 1,
      availability: { isActive: false },
    },
  ]);

  await assert.rejects(service.mergeGuestIntoCustomer('guest-token', 'user-1'), (error: unknown) => {
    if (!(error instanceof ConflictException)) return false;
    const response = error.getResponse() as {
      code?: string;
      details?: {
        conflicts?: Array<{
          variantId: string;
          reason: string;
          availableQuantity: number | null;
        }>;
      };
    };
    assert.equal(response.code, 'CART_MERGE_CONFLICT');
    assert.deepEqual(response.details?.conflicts, [
      {
        variantId: 'variant-1',
        reason: 'STOCK_LIMIT',
        guestQuantity: 2,
        customerQuantity: 0,
        mergedQuantity: 2,
        availableQuantity: 1,
      },
      {
        variantId: 'variant-2',
        reason: 'VARIANT_UNAVAILABLE',
        guestQuantity: 1,
        customerQuantity: 0,
        mergedQuantity: 1,
        availableQuantity: null,
      },
    ]);
    return true;
  });

  assert.equal(state.carts.has('guest-1'), true);
  assert.equal(state.ownerships.length, 0);
  assert.equal(state.carts.get('customer-1')?.items.length, 0);
});

test('returns an empty customer cart when an authenticated customer has not merged a guest cart', async () => {
  const { service, state } = createCartService([]);
  const result = await service.getCart(undefined, 'user-1');

  assert.equal(result.kind, 'CUSTOMER');
  assert.equal(result.items.length, 0);
  assert.equal(state.ownerships.length, 0);
});
