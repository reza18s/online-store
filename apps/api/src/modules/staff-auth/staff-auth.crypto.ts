import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

import { environment } from '@nova/config';

import { normalizeLocalizedDigits } from '../auth/phone';

const PASSWORD_HASH_VERSION = 'scrypt-v1';
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SCRYPT_N = 32_768;
const PASSWORD_SCRYPT_R = 8;
const PASSWORD_SCRYPT_P = 1;
const PASSWORD_SCRYPT_MAXMEM = 64 * 1024 * 1024;
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_ALLOWED_SKEW_STEPS = 1;
const TOTP_ENCRYPTION_VERSION = 'v1';

function toBase64Url(value: Uint8Array): string {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

function deriveTotpEncryptionKey(): Buffer {
  return createHash('sha256').update(environment.STAFF_TOTP_ENCRYPTION_KEY, 'utf8').digest();
}

export function hashStaffPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH, {
    N: PASSWORD_SCRYPT_N,
    r: PASSWORD_SCRYPT_R,
    p: PASSWORD_SCRYPT_P,
    maxmem: PASSWORD_SCRYPT_MAXMEM,
  });
  return [
    PASSWORD_HASH_VERSION,
    PASSWORD_SCRYPT_N,
    PASSWORD_SCRYPT_R,
    PASSWORD_SCRYPT_P,
    toBase64Url(salt),
    toBase64Url(hash),
  ].join('$');
}

export function verifyStaffPassword(password: string, encoded: string): boolean {
  const parts = encoded.split('$');
  if (parts.length !== 6 || parts[0] !== PASSWORD_HASH_VERSION) return false;

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const saltText = parts[4];
  const expectedText = parts[5];
  if (
    !Number.isSafeInteger(n) ||
    !Number.isSafeInteger(r) ||
    !Number.isSafeInteger(p) ||
    !saltText ||
    !expectedText
  ) {
    return false;
  }

  try {
    const expected = fromBase64Url(expectedText);
    if (expected.length === 0) return false;
    const actual = scryptSync(password, fromBase64Url(saltText), expected.length, {
      N: n,
      r,
      p,
      maxmem: PASSWORD_SCRYPT_MAXMEM,
    });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function encryptTotpSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveTotpEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return [
    TOTP_ENCRYPTION_VERSION,
    toBase64Url(iv),
    toBase64Url(cipher.getAuthTag()),
    toBase64Url(ciphertext),
  ].join('.');
}

export function decryptTotpSecret(encoded: string): string | null {
  const [version, ivText, tagText, ciphertextText] = encoded.split('.');
  if (!ivText || !tagText || !ciphertextText || version !== TOTP_ENCRYPTION_VERSION) return null;

  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      deriveTotpEncryptionKey(),
      fromBase64Url(ivText),
    );
    decipher.setAuthTag(fromBase64Url(tagText));
    return Buffer.concat([
      decipher.update(fromBase64Url(ciphertextText)),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return null;
  }
}

function decodeBase32(value: string): Buffer {
  const normalized = value.replace(/[\s=-]/g, '').toUpperCase();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let buffer = 0;
  let bits = 0;
  const bytes: number[] = [];

  for (const character of normalized) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error('Invalid TOTP secret.');
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  if (bytes.length === 0) throw new Error('Invalid TOTP secret.');
  return Buffer.from(bytes);
}

export function generateTotpCode(secret: string, unixSeconds: number): string {
  const counter = Math.floor(unixSeconds / TOTP_STEP_SECONDS);
  const message = Buffer.alloc(8);
  message.writeBigInt64BE(BigInt(counter), 0);
  const digest = createHmac('sha1', decodeBase32(secret)).update(message).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);
  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

export function verifyTotpCode(secret: string, input: string, now = Date.now()): boolean {
  const code = normalizeLocalizedDigits(input.normalize('NFKC')).replace(/\s/g, '');
  if (!/^\d{6}$/.test(code)) return false;

  const unixSeconds = Math.floor(now / 1_000);
  try {
    for (let offset = -TOTP_ALLOWED_SKEW_STEPS; offset <= TOTP_ALLOWED_SKEW_STEPS; offset += 1) {
      const expected = generateTotpCode(secret, unixSeconds + offset * TOTP_STEP_SECONDS);
      const expectedBytes = Buffer.from(expected, 'utf8');
      const codeBytes = Buffer.from(code, 'utf8');
      if (timingSafeEqual(expectedBytes, codeBytes)) return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function normalizeRecoveryCode(input: string): string | null {
  const normalized = normalizeLocalizedDigits(input.normalize('NFKC'))
    .replace(/[\s-]/g, '')
    .toUpperCase();
  return /^[A-Z0-9]{10}$/.test(normalized) ? normalized : null;
}

export function hashRecoveryCode(code: string): string {
  return createHmac('sha256', environment.AUTH_SECRET)
    .update(`staff-recovery:${code}`)
    .digest('hex');
}

export function createRecoveryCode(): string {
  return randomBytes(8).toString('hex').toUpperCase().slice(0, 10);
}
