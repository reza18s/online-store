import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { CartItemMutation } from '@nova/api-client';

import { CartService, hashCartToken, toCartView, type AuthoritativeCart } from './cart.service';

interface FakeCartState {
  quantity: number;
  priceToman: number;
  inventory: { onHand: number; reserved: number } | null;
  mutation: { variantId: string; quantityDelta: number } | null;
}

function makeCartSource(state: FakeCartState): AuthoritativeCart {
  return {
    id: 'cart-1',
    kind: 'GUEST' as const,
    items:
      state.quantity > 0
        ? [
            {
              id: 'item-1',
              variantId: 'variant-1',
              quantity: state.quantity,
              variant: {
                id: 'variant-1',
                sku: 'NOVA-LINEN-001-M',
                title: 'کرم / M',
                priceToman: state.priceToman,
                compareAtPriceToman: null,
                isActive: true,
                inventory: state.inventory,
                product: {
                  id: 'product-1',
                  slug: 'linen-overshirt',
                  name: 'مانتوی لینن کمربندی آوا',
                  status: 'PUBLISHED',
                  archivedAt: null,
                  basePriceToman: state.priceToman,
                  compareAtPriceToman: null,
                  media: [
                    {
                      url: '/assets/nova-product-linen-overshirt.webp',
                      altText: 'مانتوی لینن روشن',
                    },
                  ],
                },
              },
            },
          ]
        : [],
  };
}

function createFakeService(overrides: Partial<FakeCartState> = {}) {
  const state: FakeCartState = {
    quantity: 0,
    priceToman: 2_490_000,
    inventory: { onHand: 8, reserved: 0 },
    mutation: null,
    ...overrides,
  };
  const source = () => makeCartSource(state);
  const transaction = {
    cart: {
      findUnique: async ({ select }: { select?: { items?: unknown } }) =>
        select?.items ? source() : { id: 'cart-1' },
    },
    cartItem: {
      findUnique: async () => (state.quantity > 0 ? { quantity: state.quantity } : null),
      create: async ({ data }: { data: { quantity: number } }) => {
        state.quantity = data.quantity;
        return { id: 'item-1' };
      },
      update: async ({ data }: { data: { quantity: number } }) => {
        state.quantity = data.quantity;
        return { id: 'item-1' };
      },
      deleteMany: async () => {
        state.quantity = 0;
        return { count: 1 };
      },
    },
    cartMutation: {
      findUnique: async () => state.mutation,
      create: async ({ data }: { data: { variantId: string; quantityDelta: number } }) => {
        state.mutation = data;
        return { id: 'mutation-1' };
      },
    },
    productVariant: {
      findFirst: async () => ({ id: 'variant-1', inventory: state.inventory }),
    },
  };
  const prisma = {
    cart: {
      findFirst: async () => source(),
      create: async () => ({ id: 'cart-1' }),
    },
    $transaction: async (callback: (value: typeof transaction) => Promise<unknown>) =>
      callback(transaction),
  };

  return { service: new CartService({ prisma } as never), state };
}

test('hashes opaque cart tokens deterministically without exposing the token', () => {
  const token = 'guest-token';

  assert.equal(hashCartToken(token), hashCartToken(token));
  assert.notEqual(hashCartToken(token), token);
  assert.equal(hashCartToken(token).length, 64);
});

test('serializes live pricing and availability without inventory internals', () => {
  const source = makeCartSource({
    quantity: 2,
    priceToman: 1_250_000,
    inventory: { onHand: 4, reserved: 1 },
    mutation: null,
  });
  const view = toCartView(source);

  assert.equal(view.itemCount, 2);
  assert.equal(view.subtotalToman, 2_500_000);
  assert.equal(view.items[0]?.available, true);
  assert.equal(view.items[0]?.unitPriceToman, 1_250_000);
  assert.equal(Object.hasOwn(view.items[0] ?? {}, 'onHand'), false);
  assert.equal(Object.hasOwn(view.items[0] ?? {}, 'reserved'), false);
});

test('does not expose an inherited compare-at price above the active variant price', () => {
  const source = makeCartSource({
    quantity: 1,
    priceToman: 1_250_000,
    inventory: { onHand: 4, reserved: 0 },
    mutation: null,
  });
  const item = source.items[0];
  if (!item) throw new Error('missing fake cart item');
  item.variant.product.basePriceToman = 1_000_000;
  item.variant.product.compareAtPriceToman = 1_200_000;

  const view = toCartView(source);

  assert.equal(view.items[0]?.unitPriceToman, 1_250_000);
  assert.equal(view.items[0]?.compareAtPriceToman, null);
});

test('adds an available variant and replays the same idempotency key safely', async () => {
  const { service, state } = createFakeService();
  const input: CartItemMutation = { variantId: 'variant-1', quantity: 2 };

  const first = await service.addItem(undefined, input, 'cart-add-1');
  assert.ok(first.token);
  const second = await service.addItem(first.token, input, 'cart-add-1');

  assert.equal(first.cart.itemCount, 2);
  assert.equal(second.cart.itemCount, 2);
  assert.equal(state.quantity, 2);
  assert.equal(first.token?.length, 43);
});

test('rejects an unavailable variant before adding it to the cart', async () => {
  const { service, state } = createFakeService({ inventory: { onHand: 0, reserved: 0 } });

  await assert.rejects(
    service.addItem(undefined, { variantId: 'variant-1', quantity: 1 }),
    /موجود نیست/,
  );
  assert.equal(state.quantity, 0);
});

test('updates quantity and treats removing a missing item as idempotent', async () => {
  const { service, state } = createFakeService({ quantity: 2 });

  const updated = await service.updateItem('guest-token', 'variant-1', 5);
  const removed = await service.removeItem('guest-token', 'variant-1');
  const repeated = await service.removeItem('guest-token', 'variant-1');

  assert.equal(updated.itemCount, 5);
  assert.equal(removed.itemCount, 0);
  assert.equal(repeated.itemCount, 0);
  assert.equal(state.quantity, 0);
});

test('rejects quantities outside the server-side cart limit', async () => {
  const { service } = createFakeService();

  await assert.rejects(
    service.addItem(undefined, { variantId: 'variant-1', quantity: 100 }),
    /بین ۱ تا ۹۹/,
  );
});
