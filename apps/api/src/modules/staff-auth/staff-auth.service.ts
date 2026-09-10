import { createHash } from 'node:crypto';

import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DEFAULT_STAFF_TOTP_ENCRYPTION_KEY, environment } from '@nova/config';

import { DatabaseService } from '../../database/database.service';
import { OTP_STATE_STORE, type OtpStateStore } from '../auth/otp-state.store';
import {
  STAFF_SESSION_ABSOLUTE_SECONDS,
  SessionService,
  type AuthenticatedStaff,
} from '../auth/session.service';
import {
  decryptTotpSecret,
  hashRecoveryCode,
  normalizeRecoveryCode,
  verifyStaffPassword,
  verifyTotpCode,
} from './staff-auth.crypto';

export const STAFF_LOGIN_MAX_ATTEMPTS = 5;
export const STAFF_LOGIN_WINDOW_SECONDS = 15 * 60;

interface StaffCredentialSource {
  passwordHash: string;
  totpSecretEncrypted: string;
  recoveryCodes: Array<{ id: string; codeHash: string }>;
}

interface StaffUserSource {
  id: string;
  email: string | null;
  status: AuthenticatedStaff['status'];
  roles: Array<{ role: { key: string } }>;
  staffCredential: StaffCredentialSource | null;
}

export interface StaffLoginInput {
  email: string;
  password: string;
  factor: string;
  ip: string;
}

export interface StaffLoginResult {
  user: AuthenticatedStaff;
  token: string;
  expiresAt: Date;
}

const staffUserSelect = {
  id: true,
  email: true,
  status: true,
  roles: { select: { role: { select: { key: true } } } },
  staffCredential: {
    select: {
      passwordHash: true,
      totpSecretEncrypted: true,
      recoveryCodes: {
        where: { usedAt: null },
        select: { id: true, codeHash: true },
      },
    },
  },
} as const;

function normalizeEmail(input: string): string {
  return input.normalize('NFKC').trim().toLocaleLowerCase('en-US');
}

function digest(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function loginKey(email: string, ip: string): string {
  return `nova:staff:login:${digest(`${email}:${ip}`)}`;
}

function ipKey(ip: string): string {
  return `nova:staff:login:ip:${digest(ip)}`;
}

function invalidLogin(): UnauthorizedException {
  return new UnauthorizedException('اطلاعات ورود مدیر نادرست است.');
}

function rateLimited(): HttpException {
  return new HttpException(
    'تلاش‌های ورود بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.',
    HttpStatus.TOO_MANY_REQUESTS,
  );
}

function hasStaffRole(roles: string[]): boolean {
  return roles.some((role) => ['support', 'operations', 'admin'].includes(role));
}

@Injectable()
export class StaffAuthService {
  public constructor(
    private readonly database: DatabaseService,
    @Inject(OTP_STATE_STORE) private readonly state: OtpStateStore,
    private readonly sessions: SessionService,
  ) {
    if (
      environment.NODE_ENV === 'production' &&
      environment.STAFF_TOTP_ENCRYPTION_KEY === DEFAULT_STAFF_TOTP_ENCRYPTION_KEY
    ) {
      throw new Error('STAFF_TOTP_ENCRYPTION_KEY must be changed before production startup.');
    }
  }

  public async login(input: StaffLoginInput): Promise<StaffLoginResult> {
    const email = normalizeEmail(input.email);
    const ip = input.ip.trim() || 'unknown';
    if (!email || email.length > 254) throw invalidLogin();

    const accountKey = loginKey(email, ip);
    const addressKey = ipKey(ip);
    await this.assertNotRateLimited(accountKey, addressKey);

    const user = (await this.database.prisma.user.findUnique({
      where: { email },
      select: staffUserSelect,
    })) as StaffUserSource | null;

    if (!user || user.status !== 'ACTIVE' || !user.email || !user.staffCredential) {
      await this.recordFailure(accountKey, addressKey);
      throw invalidLogin();
    }

    const roles = user.roles.map(({ role }) => role.key.toLocaleLowerCase('en-US'));
    if (
      !hasStaffRole(roles) ||
      !verifyStaffPassword(input.password, user.staffCredential.passwordHash)
    ) {
      await this.recordFailure(accountKey, addressKey);
      throw invalidLogin();
    }

    const factorVerified = await this.verifySecondFactor(
      user.id,
      user.staffCredential,
      input.factor,
    );
    if (!factorVerified) {
      await this.recordFailure(accountKey, addressKey);
      throw invalidLogin();
    }

    await this.state.delete(accountKey);
    await this.state.delete(addressKey);
    const session = await this.sessions.createStaffSession(user.id);
    return {
      user: { id: user.id, email: user.email, status: user.status, roles },
      token: session.token,
      expiresAt: session.expiresAt,
    };
  }

  public async current(token: string | undefined): Promise<AuthenticatedStaff | null> {
    return (await this.sessions.resolveStaffSession(token))?.user ?? null;
  }

  public async logout(token: string | undefined): Promise<void> {
    await this.sessions.revokeStaffSession(token);
  }

  public sessionMaxAgeSeconds(): number {
    return STAFF_SESSION_ABSOLUTE_SECONDS;
  }

  private async assertNotRateLimited(accountKey: string, addressKey: string): Promise<void> {
    const [accountAttempts, addressAttempts] = await Promise.all([
      this.state.get(accountKey),
      this.state.get(addressKey),
    ]);
    if (
      Number(accountAttempts ?? '0') >= STAFF_LOGIN_MAX_ATTEMPTS ||
      Number(addressAttempts ?? '0') >= STAFF_LOGIN_MAX_ATTEMPTS
    ) {
      throw rateLimited();
    }
  }

  private async recordFailure(accountKey: string, addressKey: string): Promise<void> {
    const [accountAttempts, addressAttempts] = await Promise.all([
      this.state.increment(accountKey, STAFF_LOGIN_WINDOW_SECONDS),
      this.state.increment(addressKey, STAFF_LOGIN_WINDOW_SECONDS),
    ]);
    if (
      accountAttempts >= STAFF_LOGIN_MAX_ATTEMPTS ||
      addressAttempts >= STAFF_LOGIN_MAX_ATTEMPTS
    ) {
      throw rateLimited();
    }
  }

  private async verifySecondFactor(
    userId: string,
    credential: StaffCredentialSource,
    input: string,
  ): Promise<boolean> {
    const secret = decryptTotpSecret(credential.totpSecretEncrypted);
    if (secret && verifyTotpCode(secret, input)) return true;

    const recoveryCode = normalizeRecoveryCode(input);
    if (!recoveryCode) return false;
    const codeHash = hashRecoveryCode(recoveryCode);
    const stored = credential.recoveryCodes.find((code) => code.codeHash === codeHash);
    if (!stored) return false;

    const claimed = await this.database.prisma.staffRecoveryCode.updateMany({
      where: { id: stored.id, userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    return claimed.count === 1;
  }
}
