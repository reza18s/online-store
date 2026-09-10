import assert from 'node:assert/strict';
import { test } from 'node:test';

import { NotFoundException } from '@nestjs/common';

import { AddressService } from './address.service';

interface FakeAddress {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FakeStore {
  addresses: Map<string, FakeAddress>;
  nextId: number;
}

function cloneStore(source: FakeStore): FakeStore {
  return {
    addresses: new Map(
      [...source.addresses].map(([key, value]) => [
        key,
        { ...value, createdAt: new Date(value.createdAt), updatedAt: new Date(value.updatedAt) },
      ]),
    ),
    nextId: source.nextId,
  };
}

function commitStore(target: FakeStore, source: FakeStore): void {
  target.addresses = source.addresses;
  target.nextId = source.nextId;
}

function matches(address: FakeAddress, where: Record<string, unknown>): boolean {
  if (typeof where.id === 'string' && address.id !== where.id) return false;
  if (typeof where.userId === 'string' && address.userId !== where.userId) return false;
  if (typeof where.isDefault === 'boolean' && address.isDefault !== where.isDefault) return false;
  const idFilter = where.id as { not?: string } | undefined;
  if (idFilter?.not && address.id === idFilter.not) return false;
  return true;
}

function createAddressService() {
  const state: FakeStore = { addresses: new Map(), nextId: 1 };
  const makeClient = (store: FakeStore) => ({
    address: {
      findMany: async ({ where }: { where: Record<string, unknown> }) =>
        [...store.addresses.values()]
          .filter((address) => matches(address, where))
          .sort((left, right) => {
            if (left.isDefault !== right.isDefault) return left.isDefault ? -1 : 1;
            return right.updatedAt.getTime() - left.updatedAt.getTime();
          }),
      count: async ({ where }: { where: Record<string, unknown> }) =>
        [...store.addresses.values()].filter((address) => matches(address, where)).length,
      findFirst: async ({
        where,
      }: {
        where: Record<string, unknown>;
        orderBy?: Record<string, 'asc' | 'desc'>;
      }) => {
        const candidates = [...store.addresses.values()].filter((address) =>
          matches(address, where),
        );
        candidates.sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
        return candidates[0] ?? null;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const now = new Date();
        const address: FakeAddress = {
          id: `address-${store.nextId++}`,
          userId: String(data.userId),
          label: String(data.label),
          recipientName: String(data.recipientName),
          phone: String(data.phone),
          province: String(data.province),
          city: String(data.city),
          addressLine: String(data.addressLine),
          postalCode: String(data.postalCode),
          isDefault: data.isDefault === true,
          createdAt: now,
          updatedAt: now,
        };
        store.addresses.set(address.id, address);
        return address;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Partial<FakeAddress>;
      }) => {
        let count = 0;
        for (const address of store.addresses.values()) {
          if (!matches(address, where)) continue;
          if (data.isDefault !== undefined) address.isDefault = data.isDefault;
          address.updatedAt = new Date();
          count += 1;
        }
        return { count };
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<FakeAddress> }) => {
        const address = store.addresses.get(where.id);
        if (!address) throw new Error('missing fake address');
        for (const [key, value] of Object.entries(data)) {
          if (key === 'id' || key === 'userId' || key === 'createdAt' || key === 'updatedAt')
            continue;
          if (value !== undefined) (address as unknown as Record<string, unknown>)[key] = value;
        }
        address.updatedAt = new Date();
        return address;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const address = store.addresses.get(where.id);
        if (!address) throw new Error('missing fake address');
        store.addresses.delete(where.id);
        return address;
      },
    },
  });

  const prisma = {
    $transaction: async <T>(
      callback: (transaction: ReturnType<typeof makeClient>) => Promise<T>,
    ) => {
      const working = cloneStore(state);
      const result = await callback(makeClient(working));
      commitStore(state, working);
      return result;
    },
    address: makeClient(state).address,
  };

  return { service: new AddressService({ prisma } as never), state };
}

test('creates the first address as default and normalizes contact fields', async () => {
  const { service, state } = createAddressService();

  const address = await service.create('user-1', {
    label: ' خانه ',
    recipientName: ' سارا احمدی ',
    phone: '۰۹۱۲ ۳۴۵ ۶۷۸۹',
    province: 'تهران',
    city: 'تهران',
    addressLine: 'خیابان ولیعصر، پلاک ۲۴',
    postalCode: '۱۲۳۴۵ ۶۷۸۹۰',
  });

  assert.equal(address.label, 'خانه');
  assert.equal(address.phone, '+989123456789');
  assert.equal(address.postalCode, '1234567890');
  assert.equal(address.isDefault, true);
  assert.equal(state.addresses.size, 1);
});

test('moves the default flag without affecting another customer address', async () => {
  const { service } = createAddressService();
  const first = await service.create('user-1', {
    label: 'خانه',
    recipientName: 'سارا احمدی',
    phone: '09123456789',
    province: 'تهران',
    city: 'تهران',
    addressLine: 'نشانی اول',
    postalCode: '1234567890',
  });
  const second = await service.create('user-1', {
    label: 'محل کار',
    recipientName: 'سارا احمدی',
    phone: '09123456789',
    province: 'تهران',
    city: 'تهران',
    addressLine: 'نشانی دوم',
    postalCode: '1234567890',
  });

  const selected = await service.setDefault('user-1', second.id);
  const addresses = await service.list('user-1');

  assert.equal(selected.isDefault, true);
  assert.equal(addresses.find((address) => address.id === first.id)?.isDefault, false);
  assert.equal(addresses.find((address) => address.id === second.id)?.isDefault, true);
});

test('promotes another address when the default is deleted and isolates users', async () => {
  const { service } = createAddressService();
  const first = await service.create('user-1', {
    label: 'خانه',
    recipientName: 'سارا احمدی',
    phone: '09123456789',
    province: 'تهران',
    city: 'تهران',
    addressLine: 'نشانی اول',
    postalCode: '1234567890',
  });
  const second = await service.create('user-1', {
    label: 'محل کار',
    recipientName: 'سارا احمدی',
    phone: '09123456789',
    province: 'تهران',
    city: 'تهران',
    addressLine: 'نشانی دوم',
    postalCode: '1234567890',
  });

  await assert.rejects(
    service.update('user-2', first.id, { label: 'نباید تغییر کند' }),
    (error: unknown) => error instanceof NotFoundException,
  );
  const remaining = await service.remove('user-1', first.id);

  assert.equal(remaining.length, 1);
  assert.equal(remaining[0]?.id, second.id);
  assert.equal(remaining[0]?.isDefault, true);
});
