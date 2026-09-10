import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@nova/db';

const MAX_JSON_DEPTH = 8;
const MAX_JSON_LENGTH = 50_000;

function isJsonValue(value: unknown, depth = 0): value is Prisma.InputJsonValue | null {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (depth >= MAX_JSON_DEPTH || typeof value !== 'object') return false;

  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item, depth + 1));
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) return false;
  return Object.values(value).every((item) => isJsonValue(item, depth + 1));
}

export function normalizeContentJson(
  value: unknown,
  field = 'JSON',
): Prisma.JsonNullValueInput | Prisma.InputJsonValue {
  if (value === undefined || value === null) return Prisma.JsonNull;
  if (!isJsonValue(value)) {
    throw new BadRequestException(`${field} باید JSON معتبر و کم‌عمق باشد.`);
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new BadRequestException(`${field} باید JSON معتبر باشد.`);
  }
  if (serialized.length > MAX_JSON_LENGTH) {
    throw new BadRequestException(`${field} بیش از حد بزرگ است.`);
  }

  return value;
}
