import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { environment } from '@nova/config';

import type { RequestWithId, ResponseWithHeaders } from '../../common/http/request-id.middleware';
import type { OtpStateStore } from '../auth/otp-state.store';
import {
  createRecoveryCode,
  encryptTotpSecret,
  generateTotpCode,
  hashRecoveryCode,
  hashStaffPassword,
  verifyStaffPassword,
} from './staff-auth.crypto';
import {
  SessionService,
  STAFF_SESSION_COOKIE_NAME,
  STAFF_SESSION_ABSOLUTE_SECONDS,
  hashSessionToken,
} from '../auth/session.service';
import {
  assertStaffRole,
  STAFF_ROLES_KEY,
  StaffAuthGuard,
  StaffRoleGuard,
  type StaffRequest,
  type StaffRole,
} from './staff-auth.guard';
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

class FakeResponse implements ResponseWithHeaders {
  private readonly headers = new Map<string, string | string[]>();

  public setHeader(name: string, value: string | string[]): void {
    this.headers.set(name.toLowerCase(), value);
  }

  public getHeader(name: string): string | string[] | undefined {
    return this.headers.get(name.toLowerCase());
  }
}

function httpContext(request: StaffRequest) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as never;
}

function roleContext(request: StaffRequest) {
  return {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as never;
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
  assert.equal(
    verifyStaffPassword('any password', 'scrypt-v1$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$!'),
    false,
  );

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

test('StaffAuthGuard authenticates staff/me from only nova_staff_session and delegates missing or invalid sessions', async () => {
  const staff = {
    id: 'staff-1',
    email: 'staff@nova.example',
    status: 'ACTIVE' as const,
    roles: ['admin'],
  };
  const validToken = 's'.repeat(43);
  const resolvedTokens: Array<string | undefined> = [];
  const sessions = {
    resolveStaffSession: async (token: string | undefined) => {
      resolvedTokens.push(token);
      return token === validToken
        ? { user: staff, expiresAt: new Date('2026-09-14T12:00:00.000Z') }
        : null;
    },
  };
  const guard = new StaffAuthGuard(sessions as never);

  const authenticatedRequest = {
    headers: {
      cookie: `nova_session=customer-token; ${STAFF_SESSION_COOKIE_NAME}=${validToken}`,
    },
  } as StaffRequest;
  assert.equal(await guard.canActivate(httpContext(authenticatedRequest)), true);
  assert.deepEqual(authenticatedRequest.staff, staff);

  const rejectedCases: Array<{ cookie: string | undefined; expectedToken: string | undefined }> = [
    { cookie: undefined, expectedToken: undefined },
    { cookie: 'nova_session=customer-token', expectedToken: undefined },
    {
      cookie: `${STAFF_SESSION_COOKIE_NAME}=unknown-token`,
      expectedToken: 'unknown-token',
    },
  ];
  for (const current of rejectedCases) {
    const request = {
      headers: current.cookie === undefined ? undefined : { cookie: current.cookie },
    } as StaffRequest;
    await assert.rejects(guard.canActivate(httpContext(request)), (error: unknown) => {
      return error instanceof HttpException && error.getStatus() === HttpStatus.UNAUTHORIZED;
    });
    assert.equal(request.staff, undefined);
    assert.equal(resolvedTokens.at(-1), current.expectedToken);
  }

  assert.deepEqual(resolvedTokens, [validToken, undefined, undefined, 'unknown-token']);
});

test('StaffRoleGuard permits matching roles, rejects missing or mismatched staff, and permits routes without role metadata', () => {
  let configuredRoles: StaffRole[] | undefined = ['admin'];
  const reflector = {
    getAllAndOverride: (key: string, targets: unknown[]) => {
      assert.equal(key, STAFF_ROLES_KEY);
      assert.deepEqual(targets, ['handler', 'class']);
      return configuredRoles;
    },
  };
  const guard = new StaffRoleGuard(reflector as never);
  const adminStaff = {
    id: 'staff-1',
    email: 'staff@nova.example',
    status: 'ACTIVE' as const,
    roles: ['admin'] as StaffRole[],
  };

  assert.equal(guard.canActivate(roleContext({ staff: adminStaff } as StaffRequest)), true);

  assert.throws(
    () => guard.canActivate(roleContext({} as StaffRequest)),
    (error: unknown) =>
      error instanceof HttpException && error.getStatus() === HttpStatus.UNAUTHORIZED,
  );

  assert.throws(
    () =>
      guard.canActivate(
        roleContext({
          staff: { ...adminStaff, roles: ['support'] as StaffRole[] },
        } as StaffRequest),
      ),
    (error: unknown) =>
      error instanceof HttpException && error.getStatus() === HttpStatus.FORBIDDEN,
  );

  configuredRoles = undefined;
  assert.equal(guard.canActivate(roleContext({} as StaffRequest)), true);
});

test('staff login emits the configured session cookie and returns the typed staff envelope', async () => {
  const token = 'staff-login-token';
  const staff = {
    id: 'staff-1',
    email: 'staff@nova.example',
    status: 'ACTIVE' as const,
    roles: ['admin'] as StaffRole[],
  };
  const auth = {
    login: async (input: unknown) => {
      assert.deepEqual(input, {
        email: 'staff@nova.example',
        password: 'correct horse battery staple',
        factor: '123456',
        ip: '198.51.100.10',
      });
      return { token, user: staff };
    },
  };
  const controller = new StaffAuthController(auth as never);
  const response = new FakeResponse();
  const result = await controller.login(
    { requestId: 'staff-login-request', ip: '198.51.100.10' },
    response,
    {
      email: 'staff@nova.example',
      password: 'correct horse battery staple',
      factor: '123456',
    },
  );

  assert.deepEqual(result.data, staff);
  assert.equal(result.meta.requestId, 'staff-login-request');
  assert.match(result.meta.timestamp, /^\d{4}-\d{2}-\d{2}T/);

  const secure = environment.WEB_ORIGIN.startsWith('https://') ? '; Secure' : '';
  assert.deepEqual(response.getHeader('Set-Cookie'), [
    `${STAFF_SESSION_COOKIE_NAME}=${token}; Max-Age=${STAFF_SESSION_ABSOLUTE_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secure}`,
  ]);
});

test('staff logout delegates the staff cookie revoke, clears it, and returns a null envelope for missing, unknown, or malformed cookies', async () => {
  type RevokeCall = {
    where: {
      tokenHash: string;
      kind: string;
      revokedAt: null;
    };
    data: { revokedAt: Date };
  };
  const revoked: RevokeCall[] = [];
  const database = {
    prisma: {
      session: {
        updateMany: async (args: RevokeCall) => {
          revoked.push(args);
          return { count: 0 };
        },
      },
    },
  };
  const auth = new StaffAuthService(
    {} as never,
    {} as never,
    new SessionService(database as never),
  );
  const controller = new StaffAuthController(auth);
  const unknownToken = 'e'.repeat(43);
  const cases = [
    { name: 'missing', cookie: 'nova_session=customer-token' },
    {
      name: 'unknown valid-format',
      cookie: `nova_session=customer-token; ${STAFF_SESSION_COOKIE_NAME}=${unknownToken}`,
    },
    { name: 'malformed', cookie: `${STAFF_SESSION_COOKIE_NAME}=bad.token` },
  ];

  for (const [index, current] of cases.entries()) {
    const response = new FakeResponse();
    const result = await controller.logout(
      {
        requestId: `staff-logout-${index}`,
        headers: { cookie: current.cookie },
      } as StaffRequest,
      response,
    );

    assert.equal(result.data, null, `${current.name} logout should return a null envelope`);
    assert.equal(result.meta.requestId, `staff-logout-${index}`);
    const cookies = response.getHeader('Set-Cookie');
    assert.ok(Array.isArray(cookies));
    assert.equal(cookies.length, 1);
    assert.match(
      cookies[0] ?? '',
      new RegExp(`^${STAFF_SESSION_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`),
    );
    assert.doesNotMatch(cookies[0] ?? '', /nova_session=/);
  }

  assert.equal(revoked.length, 1);
  assert.equal(revoked[0]?.where.tokenHash, hashSessionToken(unknownToken));
  assert.equal(revoked[0]?.where.kind, 'ADMIN');
  assert.equal(revoked[0]?.where.revokedAt, null);
  assert.ok(revoked[0]?.data.revokedAt instanceof Date);
});

test('SessionService rejects malformed, unknown, expired, and revoked staff tokens before returning a user', async () => {
  const now = Date.now();
  const validToken = 'v'.repeat(43);
  const unknownToken = 'u'.repeat(43);
  const expiredToken = 'e'.repeat(43);
  const revokedToken = 'r'.repeat(43);
  const records = new Map([
    [
      hashSessionToken(validToken),
      {
        expiresAt: new Date(now + 60 * 60 * 1_000),
        revokedAt: null,
      },
    ],
    [
      hashSessionToken(expiredToken),
      {
        expiresAt: new Date(now - 1_000),
        revokedAt: null,
      },
    ],
    [
      hashSessionToken(revokedToken),
      {
        expiresAt: new Date(now + 60 * 60 * 1_000),
        revokedAt: new Date(now - 1_000),
      },
    ],
  ]);
  let lookups = 0;
  const database = {
    prisma: {
      session: {
        findFirst: async ({
          where,
        }: {
          where: {
            tokenHash: string;
            kind: 'ADMIN';
            revokedAt: null;
            expiresAt: { gt: Date };
          };
        }) => {
          lookups += 1;
          const record = records.get(where.tokenHash);
          if (
            !record ||
            where.kind !== 'ADMIN' ||
            record.revokedAt !== null ||
            record.expiresAt <= where.expiresAt.gt
          ) {
            return null;
          }
          return {
            id: 'staff-session-1',
            expiresAt: record.expiresAt,
            lastSeenAt: new Date(now),
            user: {
              id: 'staff-1',
              email: 'staff@nova.example',
              status: 'ACTIVE' as const,
              roles: [{ role: { key: 'admin' } }],
            },
          };
        },
        updateMany: async () => ({ count: 0 }),
      },
    },
  };
  const sessions = new SessionService(database as never);

  assert.equal(await sessions.resolveStaffSession(undefined), null);
  assert.equal(await sessions.resolveStaffSession('bad.token'), null);
  assert.equal(lookups, 0);
  assert.equal(await sessions.resolveStaffSession(unknownToken), null);
  assert.equal(await sessions.resolveStaffSession(expiredToken), null);
  assert.equal(await sessions.resolveStaffSession(revokedToken), null);
  assert.deepEqual((await sessions.resolveStaffSession(validToken))?.user, {
    id: 'staff-1',
    email: 'staff@nova.example',
    status: 'ACTIVE',
    roles: ['admin'],
  });
  assert.equal(lookups, 4);
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
