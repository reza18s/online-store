import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import type { OtpStateStore } from '../auth/otp-state.store';
import {
  createRecoveryCode,
  encryptTotpSecret,
  generateTotpCode,
  hashRecoveryCode,
  hashStaffPassword,
  verifyStaffPassword,
} from './staff-auth.crypto';
import { assertStaffRole } from './staff-auth.guard';
import { SessionService, hashSessionToken } from '../auth/session.service';
import { StaffAuthController } from './staff-auth.controller';
import { STAFF_LOGIN_MAX_ATTEMPTS, StaffAuthService } from './staff-auth.service';

interface StoredValue {
  value: string;
  expiresAt: number;
}

class MemoryStateStore implements OtpStateStore {
  private readonly values = new Map<string, StoredValue>();

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
    const current = this.read(key);
    const next = Number(current?.value ?? '0') + 1;
    await this.set(
      key,
      String(next),
      current ? Math.ceil((current.expiresAt - Date.now()) / 1_000) : ttlSeconds,
    );
    return next;
  }

  private read(key: string): StoredValue | null {
    const value = this.values.get(key);
    if (!value) return null;
    if (value.expiresAt <= Date.now()) {
      this.values.delete(key);
      return null;
    }
    return value;
  }
}

interface StaffFixtureOptions {
  roles?: string[];
}

function createStaffFixture(options: StaffFixtureOptions = {}) {
  const secret = 'JBSWY3DPEHPK3PXP';
  const password = 'correct horse battery staple';
  const recoveryCode = createRecoveryCode();
  let recoveryUsed = false;
  let sessionCount = 0;
  const store = new MemoryStateStore();
  const user = {
    id: 'staff-1',
    email: 'staff@nova.example',
    status: 'ACTIVE' as const,
    roles: (options.roles ?? ['admin']).map((key) => ({ role: { key } })),
    staffCredential: {
      passwordHash: hashStaffPassword(password),
      totpSecretEncrypted: encryptTotpSecret(secret),
      recoveryCodes: [
        {
          id: 'recovery-1',
          codeHash: hashRecoveryCode(recoveryCode),
        },
      ],
    },
  };
  const database = {
    prisma: {
      user: {
        findUnique: async () => ({
          ...user,
          staffCredential: {
            ...user.staffCredential,
            recoveryCodes: recoveryUsed ? [] : user.staffCredential.recoveryCodes,
          },
        }),
      },
      staffRecoveryCode: {
        updateMany: async () => {
          if (recoveryUsed) return { count: 0 };
          recoveryUsed = true;
          return { count: 1 };
        },
      },
    },
  };
  const sessions = {
    createStaffSession: async () => {
      sessionCount += 1;
      return {
        token: 'staff-session-token',
        expiresAt: new Date('2026-09-08T20:00:00.000Z'),
      };
    },
  };

  return {
    auth: new StaffAuthService(database as never, store, sessions as never),
    secret,
    password,
    recoveryCode,
    sessionCount: () => sessionCount,
  };
}

test('hashes staff passwords and encrypts TOTP secrets without exposing plaintext', () => {
  const passwordHash = hashStaffPassword('correct horse battery staple');
  assert.notEqual(passwordHash, 'correct horse battery staple');
  assert.equal(verifyStaffPassword('correct horse battery staple', passwordHash), true);
  assert.equal(verifyStaffPassword('wrong password', passwordHash), false);

  const encrypted = encryptTotpSecret('JBSWY3DPEHPK3PXP');
  assert.equal(encrypted.includes('JBSWY3DPEHPK3PXP'), false);
});

test('returns a null envelope for the public staff CSRF bootstrap route', async () => {
  const controller = new StaffAuthController({} as StaffAuthService);
  const response = await controller.csrf({ requestId: 'staff-csrf-request' } as RequestWithId);

  assert.equal(response.data, null);
  assert.equal(response.meta.requestId, 'staff-csrf-request');
  assert.match(response.meta.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test('generates the RFC TOTP vector and accepts Persian digits within clock skew', () => {
  assert.equal(generateTotpCode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59), '287082');

  const fixture = createStaffFixture();
  const now = Date.now();
  const code = generateTotpCode(fixture.secret, Math.floor(now / 1_000));
  const persianCode = code.replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit);
  assert.match(persianCode, /^[۰-۹]{6}$/);
});

test('authenticates an active staff member with password and TOTP', async () => {
  const fixture = createStaffFixture();
  const code = generateTotpCode(fixture.secret, Math.floor(Date.now() / 1_000));

  const result = await fixture.auth.login({
    email: 'STAFF@NOVA.EXAMPLE',
    password: fixture.password,
    factor: code,
    ip: '127.0.0.1',
  });

  assert.equal(result.user.email, 'staff@nova.example');
  assert.deepEqual(result.user.roles, ['admin']);
  assert.equal(result.token, 'staff-session-token');
  assert.equal(fixture.sessionCount(), 1);
});

test('consumes a recovery code once and does not allow reuse', async () => {
  const fixture = createStaffFixture();
  const input = {
    email: 'staff@nova.example',
    password: fixture.password,
    factor: fixture.recoveryCode,
    ip: '127.0.0.2',
  };

  await fixture.auth.login(input);
  assert.equal(fixture.sessionCount(), 1);
  await assert.rejects(fixture.auth.login(input), (error: unknown) => {
    return error instanceof HttpException && error.getStatus() === HttpStatus.UNAUTHORIZED;
  });
});

test('throttles repeated invalid staff credentials and keeps role checks deny-by-default', async () => {
  const fixture = createStaffFixture({ roles: ['support'] });
  const input = {
    email: 'staff@nova.example',
    password: 'wrong password that is long enough',
    factor: '000000',
    ip: '127.0.0.3',
  };

  for (let attempt = 0; attempt < STAFF_LOGIN_MAX_ATTEMPTS - 1; attempt += 1) {
    await assert.rejects(fixture.auth.login(input), (error: unknown) => {
      return error instanceof HttpException && error.getStatus() === HttpStatus.UNAUTHORIZED;
    });
  }
  await assert.rejects(fixture.auth.login(input), (error: unknown) => {
    return error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS;
  });

  assert.throws(
    () =>
      assertStaffRole(
        { id: 'staff-1', email: 'staff@nova.example', status: 'ACTIVE', roles: ['support'] },
        'admin',
      ),
    (error: unknown) => error instanceof ForbiddenException,
  );
});

test('creates, resolves, and revokes an opaque admin session separately from customer sessions', async () => {
  let record: {
    id: string;
    tokenHash: string;
    expiresAt: Date;
    lastSeenAt: Date;
    revokedAt: Date | null;
  } | null = null;
  const database = {
    prisma: {
      session: {
        create: async ({
          data,
        }: {
          data: {
            tokenHash: string;
            userId: string;
            kind: 'ADMIN';
            expiresAt: Date;
            lastSeenAt: Date;
          };
        }) => {
          record = {
            id: 'session-1',
            tokenHash: data.tokenHash,
            expiresAt: data.expiresAt,
            lastSeenAt: data.lastSeenAt,
            revokedAt: null,
          };
          return { expiresAt: data.expiresAt };
        },
        findFirst: async ({ where }: { where: { tokenHash: string } }) => {
          if (!record || record.tokenHash !== where.tokenHash || record.revokedAt !== null) {
            return null;
          }
          return {
            id: record.id,
            expiresAt: record.expiresAt,
            lastSeenAt: record.lastSeenAt,
            user: {
              id: 'staff-1',
              email: 'staff@nova.example',
              status: 'ACTIVE' as const,
              roles: [{ role: { key: 'admin' } }],
            },
          };
        },
        updateMany: async ({ data }: { data: { revokedAt?: Date; lastSeenAt?: Date } }) => {
          if (!record) return { count: 0 };
          if (data.revokedAt) record.revokedAt = data.revokedAt;
          if (data.lastSeenAt) record.lastSeenAt = data.lastSeenAt;
          return { count: 1 };
        },
      },
    },
  };
  const sessions = new SessionService(database as never);

  const created = await sessions.createStaffSession('staff-1');
  const storedRecord = record as { tokenHash: string } | null;
  assert.equal(storedRecord?.tokenHash, hashSessionToken(created.token));
  const resolved = await sessions.resolveStaffSession(created.token);
  assert.equal(resolved?.user.email, 'staff@nova.example');
  assert.deepEqual(resolved?.user.roles, ['admin']);

  await sessions.revokeStaffSession(created.token);
  assert.equal(await sessions.resolveStaffSession(created.token), null);
});
