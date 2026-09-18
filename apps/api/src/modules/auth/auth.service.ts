import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { DEFAULT_AUTH_SECRET, environment } from '@nova/config';

import { DatabaseService } from '../../database/database.service';
import { normalizeIranianPhone, normalizeOtpCode } from './phone';
import { OTP_DELIVERY, type OtpDelivery } from './otp-delivery';
import { OTP_STATE_STORE, type OtpStateStore } from './otp-state.store';
import {
  CUSTOMER_SESSION_ABSOLUTE_SECONDS,
  SessionService,
  type AuthenticatedCustomer,
} from './session.service';

export const OTP_TTL_SECONDS = 5 * 60;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

interface OtpChallengeRecord {
  phone: string;
  verifier: string;
}

export interface RequestOtpInput {
  phone: string;
  ip: string;
}

export interface OtpRequestResult {
  challengeId: string;
  expiresAt: Date;
  resendAvailableAt: Date;
  localCode?: string;
}

export interface VerifyOtpResult {
  user: AuthenticatedCustomer;
  expiresAt: Date;
  token: string;
}

const latestChallengePrefix = 'nova:auth:otp:latest:';
const challengePrefix = 'nova:auth:otp:challenge:';
const attemptPrefix = 'nova:auth:otp:attempts:';
const consumedPrefix = 'nova:auth:otp:consumed:';
const phoneCooldownPrefix = 'nova:auth:otp:cooldown:phone:';
const ipCooldownPrefix = 'nova:auth:otp:cooldown:ip:';

function keyDigest(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function challengeKey(challengeId: string): string {
  return `${challengePrefix}${challengeId}`;
}

function latestKey(phone: string): string {
  return `${latestChallengePrefix}${keyDigest(phone)}`;
}

function attemptKey(challengeId: string): string {
  return `${attemptPrefix}${challengeId}`;
}

function consumedKey(challengeId: string): string {
  return `${consumedPrefix}${challengeId}`;
}

function phoneCooldownKey(phone: string): string {
  return `${phoneCooldownPrefix}${keyDigest(phone)}`;
}

function ipCooldownKey(ip: string): string {
  return `${ipCooldownPrefix}${keyDigest(ip)}`;
}

function createChallengeId(): string {
  return randomBytes(24).toString('base64url');
}

function createOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function createOtpVerifier(challengeId: string, code: string, secret: string): string {
  return createHmac('sha256', secret).update(`${challengeId}:${code}`, 'utf8').digest('hex');
}

export function verifyOtpVerifier(
  challengeId: string,
  code: string,
  verifier: string,
  secret: string,
): boolean {
  if (!/^[a-f0-9]{64}$/.test(verifier)) return false;
  const expected = Buffer.from(createOtpVerifier(challengeId, code, secret), 'hex');
  const actual = Buffer.from(verifier, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function parseChallenge(value: string | null): OtpChallengeRecord | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as { phone?: unknown }).phone !== 'string' ||
      typeof (parsed as { verifier?: unknown }).verifier !== 'string'
    ) {
      return null;
    }
    return {
      phone: (parsed as { phone: string }).phone,
      verifier: (parsed as { verifier: string }).verifier,
    };
  } catch {
    return null;
  }
}

function invalidOtp(): BadRequestException {
  return new BadRequestException('کد واردشده معتبر نیست.');
}

function rateLimited(): HttpException {
  return new HttpException('لطفاً کمی بعد دوباره تلاش کنید.', HttpStatus.TOO_MANY_REQUESTS);
}

@Injectable()
export class AuthService {
  public constructor(
    private readonly database: DatabaseService,
    @Inject(OTP_STATE_STORE) private readonly otpStore: OtpStateStore,
    @Inject(OTP_DELIVERY) private readonly otpDelivery: OtpDelivery,
    private readonly sessions: SessionService,
  ) {
    if (environment.NODE_ENV === 'production' && environment.AUTH_SECRET === DEFAULT_AUTH_SECRET) {
      throw new Error('AUTH_SECRET must be changed before production startup.');
    }
  }

  public async requestOtp(input: RequestOtpInput): Promise<OtpRequestResult> {
    const phone = normalizeIranianPhone(input.phone);
    const ip = input.ip.trim() || 'unknown';
    const phoneAllowed = await this.otpStore.setIfAbsent(
      phoneCooldownKey(phone),
      '1',
      OTP_RESEND_COOLDOWN_SECONDS,
    );
    if (!phoneAllowed) throw rateLimited();

    const ipAllowed = await this.otpStore.setIfAbsent(
      ipCooldownKey(ip),
      '1',
      OTP_RESEND_COOLDOWN_SECONDS,
    );
    if (!ipAllowed) throw rateLimited();

    const challengeId = createChallengeId();
    const code = createOtpCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_TTL_SECONDS * 1_000);
    const resendAvailableAt = new Date(now.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1_000);
    const record: OtpChallengeRecord = {
      phone,
      verifier: createOtpVerifier(challengeId, code, environment.AUTH_SECRET),
    };

    await this.otpStore.set(challengeKey(challengeId), JSON.stringify(record), OTP_TTL_SECONDS);
    await this.otpStore.set(latestKey(phone), challengeId, OTP_TTL_SECONDS);
    const deliveryResult = await this.otpDelivery.send(phone, code);
    const localCode =
      deliveryResult && typeof deliveryResult === 'object' ? deliveryResult.localCode : undefined;

    return {
      challengeId,
      expiresAt,
      resendAvailableAt,
      ...(localCode ? { localCode } : {}),
    };
  }

  public async verifyOtp(challengeId: string, inputCode: string): Promise<VerifyOtpResult> {
    if (!/^[A-Za-z0-9_-]{24,64}$/.test(challengeId)) throw invalidOtp();
    const code = normalizeOtpCode(inputCode);
    const challenge = parseChallenge(await this.otpStore.get(challengeKey(challengeId)));
    if (!challenge) throw invalidOtp();
    if ((await this.otpStore.get(latestKey(challenge.phone))) !== challengeId) {
      throw invalidOtp();
    }

    const attempts = await this.otpStore.increment(attemptKey(challengeId), OTP_TTL_SECONDS);
    if (attempts > OTP_MAX_ATTEMPTS) throw invalidOtp();
    if (!verifyOtpVerifier(challengeId, code, challenge.verifier, environment.AUTH_SECRET)) {
      throw invalidOtp();
    }

    const claimed = await this.otpStore.setIfAbsent(consumedKey(challengeId), '1', OTP_TTL_SECONDS);
    if (!claimed) throw invalidOtp();

    await this.otpStore.delete(challengeKey(challengeId));
    await this.otpStore.delete(attemptKey(challengeId));

    const existing = await this.database.prisma.user.findUnique({
      where: { phone: challenge.phone },
      select: { status: true },
    });
    if (existing && existing.status !== 'ACTIVE') {
      throw new ForbiddenException('ورود امکان‌پذیر نیست.');
    }

    const user = await this.database.prisma.user.upsert({
      where: { phone: challenge.phone },
      update: { phoneVerifiedAt: new Date() },
      create: { phone: challenge.phone, phoneVerifiedAt: new Date() },
      select: { id: true, phone: true, email: true, status: true },
    });
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('ورود امکان‌پذیر نیست.');
    }
    const session = await this.sessions.createCustomerSession(user.id);

    return {
      user,
      token: session.token,
      expiresAt: session.expiresAt,
    };
  }

  public async current(token: string | undefined): Promise<AuthenticatedCustomer | null> {
    return (await this.sessions.resolveCustomerSession(token))?.user ?? null;
  }

  public async logout(token: string | undefined): Promise<void> {
    await this.sessions.revokeCustomerSession(token);
  }

  public sessionMaxAgeSeconds(): number {
    return CUSTOMER_SESSION_ABSOLUTE_SECONDS;
  }
}
