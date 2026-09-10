import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import type { UserStatus } from '@nova/db';

import {
  AuthService,
  createOtpVerifier,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  verifyOtpVerifier,
} from './auth.service';
import { normalizeIranianPhone, normalizeOtpCode } from './phone';
import { CUSTOMER_SESSION_IDLE_SECONDS, SessionService, hashSessionToken } from './session.service';

interface OtpValue {
  value: string;
  expiresAt: number;
}

class InMemoryOtpStateStore {
  private readonly values = new Map<string, OtpValue>();

  public async get(key: string): Promise<string | null> {
    const value = this.read(key);
    return value?.value ?? null;
  }

  public async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.values.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1_000 });
  }

  public async setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (this.read(key)) return false;
    await this.set(key, value, ttlSeconds);
    return true;
  }

  public async delete(key: string): Promise<void> {
    this.values.delete(key);
  }

  public async increment(key: string, ttlSeconds: number): Promise<number> {
    const existing = this.read(key);
    const next = Number(existing?.value ?? '0') + 1;
    this.values.set(key, {
      value: String(next),
      expiresAt: existing?.expiresAt ?? Date.now() + ttlSeconds * 1_000,
    });
    return next;
  }

  public clearCooldowns(): void {
    for (const key of this.values.keys()) {
      if (key.includes(':cooldown:')) this.values.delete(key);
    }
  }

  private read(key: string): OtpValue | null {
    const value = this.values.get(key);
    if (!value) return null;
    if (value.expiresAt <= Date.now()) {
      this.values.delete(key);
      return null;
    }
    return value;
  }
}

class InMemoryOtpDelivery {
  public readonly sent: Array<{ phone: string; code: string }> = [];

  public async send(phone: string, code: string): Promise<void> {
    this.sent.push({ phone, code });
  }
}

interface FakeUser {
  id: string;
  phone: string;
  email: string | null;
  status: UserStatus;
  phoneVerifiedAt: Date | null;
}

function createAuthHarness(existingStatus?: UserStatus) {
  const phone = '+989123456789';
  const user: FakeUser | null = existingStatus
    ? {
        id: 'user-1',
        phone,
        email: null,
        status: existingStatus,
        phoneVerifiedAt: new Date('2026-09-08T08:00:00.000Z'),
      }
    : null;
  const state = { user };
  const database = {
    prisma: {
      user: {
        findUnique: async ({ where }: { where: { phone: string } }) =>
          state.user?.phone === where.phone ? { status: state.user.status } : null,
        upsert: async ({
          where,
          update,
          create,
        }: {
          where: { phone: string };
          update: { phoneVerifiedAt: Date };
          create: { phone: string; phoneVerifiedAt: Date };
        }) => {
          if (!state.user) {
            state.user = {
              id: 'user-1',
              phone: create.phone,
              email: null,
              status: 'ACTIVE',
              phoneVerifiedAt: create.phoneVerifiedAt,
            };
          } else {
            state.user.phone = where.phone;
            state.user.phoneVerifiedAt = update.phoneVerifiedAt;
          }
          return {
            id: state.user.id,
            phone: state.user.phone,
            email: state.user.email,
            status: state.user.status,
          };
        },
      },
    },
  };
  const store = new InMemoryOtpStateStore();
  const delivery = new InMemoryOtpDelivery();
  let createdSessionCount = 0;
  const sessions = {
    createCustomerSession: async () => {
      createdSessionCount += 1;
      return {
        token: 'customer-session-token',
        expiresAt: new Date('2026-12-07T08:00:00.000Z'),
      };
    },
  };

  return {
    auth: new AuthService(database as never, store as never, delivery as never, sessions as never),
    delivery,
    state,
    store,
    sessionCount: () => createdSessionCount,
  };
}

async function assertRateLimited(operation: () => Promise<unknown>): Promise<void> {
  await assert.rejects(operation, (error: unknown) => {
    return error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS;
  });
}

test('normalizes Iranian phone numbers and Persian OTP digits without changing display text', () => {
  assert.equal(normalizeIranianPhone('۰۹۱۲۳۴۵۶۷۸۹'), '+989123456789');
  assert.equal(normalizeIranianPhone('+98 912-345-6789'), '+989123456789');
  assert.equal(normalizeIranianPhone('00989123456789'), '+989123456789');
  assert.equal(normalizeOtpCode('۱۲۳ ۴۵۶'), '123456');
});

test('uses a fixed-length HMAC verifier and rejects altered codes', () => {
  const verifier = createOtpVerifier('challenge-1', '123456', 'test-secret');

  assert.equal(verifier.length, 64);
  assert.equal(verifyOtpVerifier('challenge-1', '123456', verifier, 'test-secret'), true);
  assert.equal(verifyOtpVerifier('challenge-1', '123457', verifier, 'test-secret'), false);
  assert.equal(verifyOtpVerifier('challenge-1', '123456', 'not-a-verifier', 'test-secret'), false);
});

test('requests an OTP with cooldowns and never returns the code in the API result', async () => {
  const harness = createAuthHarness();
  const result = await harness.auth.requestOtp({ phone: '09123456789', ip: '127.0.0.1' });

  assert.match(result.challengeId, /^[A-Za-z0-9_-]{32}$/);
  assert.equal(Object.hasOwn(result, 'code'), false);
  assert.equal(harness.delivery.sent.length, 1);
  assert.equal(harness.delivery.sent[0]?.phone, '+989123456789');
  assert.ok(
    result.resendAvailableAt.getTime() - result.expiresAt.getTime() ===
      (OTP_RESEND_COOLDOWN_SECONDS - 5 * 60) * 1_000,
  );

  await assertRateLimited(() =>
    harness.auth.requestOtp({ phone: '+989123456789', ip: '127.0.0.1' }),
  );
  assert.equal(harness.delivery.sent.length, 1);
});

test('verifies a Persian OTP once and creates a customer session', async () => {
  const harness = createAuthHarness();
  const challenge = await harness.auth.requestOtp({ phone: '09123456789', ip: '127.0.0.2' });
  const message = harness.delivery.sent[0];
  assert.ok(message);

  const persianCode = message.code.replace(
    /[0-9]/g,
    (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit,
  );
  const result = await harness.auth.verifyOtp(challenge.challengeId, persianCode);

  assert.equal(result.user.phone, '+989123456789');
  assert.equal(result.token, 'customer-session-token');
  assert.equal(harness.sessionCount(), 1);
  assert.equal(harness.state.user?.phoneVerifiedAt instanceof Date, true);

  await assert.rejects(harness.auth.verifyOtp(challenge.challengeId, message.code), /معتبر نیست/);
  assert.equal(harness.sessionCount(), 1);
});

test('invalidates the previous challenge when a new challenge is issued', async () => {
  const harness = createAuthHarness();
  const first = await harness.auth.requestOtp({ phone: '09123456789', ip: '127.0.0.3' });
  const firstMessage = harness.delivery.sent[0];
  assert.ok(firstMessage);

  harness.store.clearCooldowns();
  const second = await harness.auth.requestOtp({ phone: '09123456789', ip: '127.0.0.4' });
  const secondMessage = harness.delivery.sent[1];
  assert.ok(secondMessage);

  await assert.rejects(harness.auth.verifyOtp(first.challengeId, firstMessage.code), /معتبر نیست/);
  await harness.auth.verifyOtp(second.challengeId, secondMessage.code);
  assert.equal(harness.sessionCount(), 1);
});

test('locks a challenge after the configured number of failed attempts', async () => {
  const harness = createAuthHarness();
  const challenge = await harness.auth.requestOtp({ phone: '09123456789', ip: '127.0.0.5' });
  const message = harness.delivery.sent[0];
  assert.ok(message);
  const wrongCode = message.code === '000000' ? '111111' : '000000';

  for (let attempt = 0; attempt < OTP_MAX_ATTEMPTS; attempt += 1) {
    await assert.rejects(harness.auth.verifyOtp(challenge.challengeId, wrongCode), /معتبر نیست/);
  }
  await assert.rejects(harness.auth.verifyOtp(challenge.challengeId, message.code), /معتبر نیست/);
  assert.equal(harness.sessionCount(), 0);
});

test('does not allow a suspended customer to create a session', async () => {
  const harness = createAuthHarness('SUSPENDED');
  const challenge = await harness.auth.requestOtp({ phone: '09123456789', ip: '127.0.0.6' });
  const message = harness.delivery.sent[0];
  assert.ok(message);

  await assert.rejects(
    harness.auth.verifyOtp(challenge.challengeId, message.code),
    (error: unknown) => error instanceof ForbiddenException,
  );
  assert.equal(harness.sessionCount(), 0);
});

interface FakeSessionRecord {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  lastSeenAt: Date;
  revokedAt: Date | null;
  user: {
    id: string;
    phone: string;
    email: string | null;
    status: UserStatus;
    phoneVerifiedAt: Date | null;
  };
}

function createSessionDatabase() {
  let record: FakeSessionRecord | null = null;
  const database = {
    prisma: {
      session: {
        create: async ({
          data,
        }: {
          data: {
            tokenHash: string;
            userId: string;
            kind: 'CUSTOMER';
            expiresAt: Date;
            lastSeenAt: Date;
          };
        }) => {
          record = {
            id: 'session-1',
            tokenHash: data.tokenHash,
            userId: data.userId,
            expiresAt: data.expiresAt,
            lastSeenAt: data.lastSeenAt,
            revokedAt: null,
            user: {
              id: data.userId,
              phone: '+989123456789',
              email: null,
              status: 'ACTIVE',
              phoneVerifiedAt: new Date('2026-09-08T08:00:00.000Z'),
            },
          };
          return { expiresAt: data.expiresAt };
        },
        findFirst: async ({
          where,
        }: {
          where: {
            tokenHash: string;
            kind: 'CUSTOMER';
            revokedAt: null;
            expiresAt: { gt: Date };
          };
        }) => {
          if (
            !record ||
            record.tokenHash !== where.tokenHash ||
            record.revokedAt !== null ||
            record.expiresAt <= where.expiresAt.gt
          ) {
            return null;
          }
          return {
            id: record.id,
            expiresAt: record.expiresAt,
            lastSeenAt: record.lastSeenAt,
            user: record.user,
          };
        },
        updateMany: async ({
          where,
          data,
        }: {
          where: Record<string, unknown>;
          data: { lastSeenAt?: Date; revokedAt?: Date };
        }) => {
          if (!record) return { count: 0 };
          if (typeof where.tokenHash === 'string' && where.tokenHash !== record.tokenHash) {
            return { count: 0 };
          }
          if (typeof where.id === 'string' && where.id !== record.id) return { count: 0 };
          if (typeof where.userId === 'string' && where.userId !== record.userId) {
            return { count: 0 };
          }
          if (where.revokedAt === null && record.revokedAt !== null) return { count: 0 };
          const expiry = where.expiresAt as { gt?: Date } | undefined;
          if (expiry?.gt && record.expiresAt <= expiry.gt) return { count: 0 };

          if (data.lastSeenAt) record.lastSeenAt = data.lastSeenAt;
          if (data.revokedAt) record.revokedAt = data.revokedAt;
          return { count: 1 };
        },
      },
    },
  };

  return {
    database,
    get record(): FakeSessionRecord | null {
      return record;
    },
  };
}

test('creates opaque customer sessions and revokes them', async () => {
  const fake = createSessionDatabase();
  const sessions = new SessionService(fake.database as never);

  const created = await sessions.createCustomerSession('user-1');
  assert.match(created.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(fake.record?.tokenHash, hashSessionToken(created.token));
  assert.notEqual(fake.record?.tokenHash, created.token);

  const resolved = await sessions.resolveCustomerSession(created.token);
  assert.deepEqual(resolved?.user, {
    id: 'user-1',
    phone: '+989123456789',
    email: null,
    status: 'ACTIVE',
  });

  await sessions.revokeCustomerSession(created.token);
  assert.equal(await sessions.resolveCustomerSession(created.token), null);
});

test('revokes idle customer sessions before returning the user', async () => {
  const fake = createSessionDatabase();
  const sessions = new SessionService(fake.database as never);
  const created = await sessions.createCustomerSession('user-1');
  const record = fake.record;
  assert.ok(record);
  record.lastSeenAt = new Date(Date.now() - (CUSTOMER_SESSION_IDLE_SECONDS + 1) * 1_000);

  assert.equal(await sessions.resolveCustomerSession(created.token), null);
  assert.ok(record.revokedAt);
});
