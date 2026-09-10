import { createHash, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type { UserStatus } from '@nova/db';

import { DatabaseService } from '../../database/database.service';

export const CUSTOMER_SESSION_COOKIE_NAME = 'nova_session';
export const STAFF_SESSION_COOKIE_NAME = 'nova_staff_session';
export const CUSTOMER_SESSION_IDLE_SECONDS = 60 * 60 * 24 * 30;
export const CUSTOMER_SESSION_ABSOLUTE_SECONDS = 60 * 60 * 24 * 90;
export const STAFF_SESSION_IDLE_SECONDS = 60 * 30;
export const STAFF_SESSION_ABSOLUTE_SECONDS = 60 * 60 * 12;

const SESSION_TOKEN_BYTES = 32;
const SESSION_TOUCH_INTERVAL_SECONDS = 5 * 60;

export interface AuthenticatedCustomer {
  id: string;
  phone: string;
  email: string | null;
  status: UserStatus;
}

export interface CustomerSessionResult {
  token: string;
  expiresAt: Date;
}

export interface ResolvedCustomerSession {
  user: AuthenticatedCustomer;
  expiresAt: Date;
}

export interface AuthenticatedStaff {
  id: string;
  email: string;
  status: UserStatus;
  roles: string[];
}

export interface StaffSessionResult {
  token: string;
  expiresAt: Date;
}

export interface ResolvedStaffSession {
  user: AuthenticatedStaff;
  expiresAt: Date;
}

const sessionSelect = {
  id: true,
  expiresAt: true,
  lastSeenAt: true,
  user: {
    select: {
      id: true,
      phone: true,
      email: true,
      status: true,
      phoneVerifiedAt: true,
    },
  },
} as const;

const staffSessionSelect = {
  id: true,
  expiresAt: true,
  lastSeenAt: true,
  user: {
    select: {
      id: true,
      email: true,
      status: true,
      roles: { select: { role: { select: { key: true } } } },
    },
  },
} as const;

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function createSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString('base64url');
}

@Injectable()
export class SessionService {
  public constructor(private readonly database: DatabaseService) {}

  public async createCustomerSession(userId: string): Promise<CustomerSessionResult> {
    const token = createSessionToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CUSTOMER_SESSION_ABSOLUTE_SECONDS * 1_000);

    const session = await this.database.prisma.session.create({
      data: {
        tokenHash: hashSessionToken(token),
        userId,
        kind: 'CUSTOMER',
        expiresAt,
        lastSeenAt: now,
      },
      select: { expiresAt: true },
    });

    return { token, expiresAt: session.expiresAt };
  }

  public async createStaffSession(userId: string): Promise<StaffSessionResult> {
    const token = createSessionToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + STAFF_SESSION_ABSOLUTE_SECONDS * 1_000);

    const session = await this.database.prisma.session.create({
      data: {
        tokenHash: hashSessionToken(token),
        userId,
        kind: 'ADMIN',
        expiresAt,
        lastSeenAt: now,
      },
      select: { expiresAt: true },
    });

    return { token, expiresAt: session.expiresAt };
  }

  public async resolveCustomerSession(
    token: string | undefined,
  ): Promise<ResolvedCustomerSession | null> {
    if (!token || !/^[A-Za-z0-9_-]{43,86}$/.test(token)) return null;
    const now = new Date();
    const session = await this.database.prisma.session.findFirst({
      where: {
        tokenHash: hashSessionToken(token),
        kind: 'CUSTOMER',
        revokedAt: null,
        expiresAt: { gt: now },
      },
      select: sessionSelect,
    });
    if (!session) return null;

    if (
      session.lastSeenAt.getTime() + CUSTOMER_SESSION_IDLE_SECONDS * 1_000 <= now.getTime() ||
      session.user.status !== 'ACTIVE' ||
      session.user.phoneVerifiedAt === null
    ) {
      await this.database.prisma.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: now },
      });
      return null;
    }

    if (session.lastSeenAt.getTime() + SESSION_TOUCH_INTERVAL_SECONDS * 1_000 <= now.getTime()) {
      await this.database.prisma.session.updateMany({
        where: { id: session.id, revokedAt: null, expiresAt: { gt: now } },
        data: { lastSeenAt: now },
      });
    }

    return {
      user: {
        id: session.user.id,
        phone: session.user.phone,
        email: session.user.email,
        status: session.user.status,
      },
      expiresAt: session.expiresAt,
    };
  }

  public async revokeCustomerSession(token: string | undefined): Promise<void> {
    if (!token || !/^[A-Za-z0-9_-]{43,86}$/.test(token)) return;
    await this.database.prisma.session.updateMany({
      where: {
        tokenHash: hashSessionToken(token),
        kind: 'CUSTOMER',
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  public async revokeAllCustomerSessions(userId: string): Promise<void> {
    await this.database.prisma.session.updateMany({
      where: { userId, kind: 'CUSTOMER', revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  public async resolveStaffSession(
    token: string | undefined,
  ): Promise<ResolvedStaffSession | null> {
    if (!token || !/^[A-Za-z0-9_-]{43,86}$/.test(token)) return null;
    const now = new Date();
    const session = await this.database.prisma.session.findFirst({
      where: {
        tokenHash: hashSessionToken(token),
        kind: 'ADMIN',
        revokedAt: null,
        expiresAt: { gt: now },
      },
      select: staffSessionSelect,
    });
    if (!session || session.user.status !== 'ACTIVE' || !session.user.email) return null;

    if (session.lastSeenAt.getTime() + STAFF_SESSION_IDLE_SECONDS * 1_000 <= now.getTime()) {
      await this.database.prisma.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: now },
      });
      return null;
    }

    if (session.lastSeenAt.getTime() + SESSION_TOUCH_INTERVAL_SECONDS * 1_000 <= now.getTime()) {
      await this.database.prisma.session.updateMany({
        where: { id: session.id, revokedAt: null, expiresAt: { gt: now } },
        data: { lastSeenAt: now },
      });
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        status: session.user.status,
        roles: session.user.roles.map(({ role }) => role.key),
      },
      expiresAt: session.expiresAt,
    };
  }

  public async revokeStaffSession(token: string | undefined): Promise<void> {
    if (!token || !/^[A-Za-z0-9_-]{43,86}$/.test(token)) return;
    await this.database.prisma.session.updateMany({
      where: {
        tokenHash: hashSessionToken(token),
        kind: 'ADMIN',
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  public async revokeAllStaffSessions(userId: string): Promise<void> {
    await this.database.prisma.session.updateMany({
      where: { userId, kind: 'ADMIN', revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
