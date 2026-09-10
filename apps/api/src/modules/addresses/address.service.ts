import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@nova/db';

import { DatabaseService } from '../../database/database.service';
import { normalizeIranianPhone, normalizeLocalizedDigits } from '../auth/phone';

export interface CustomerAddress {
  id: string;
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

export interface AddressCreateInput {
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  isDefault?: boolean;
}

export type AddressUpdateInput = Partial<AddressCreateInput>;

const addressSelect = {
  id: true,
  label: true,
  recipientName: true,
  phone: true,
  province: true,
  city: true,
  addressLine: true,
  postalCode: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} as const;

interface AddressSource {
  id: string;
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

function normalizeText(value: string, field: string): string {
  const normalized = value.normalize('NFKC').trim().replace(/\s+/g, ' ');
  if (!normalized) throw new BadRequestException(`${field} نمی‌تواند خالی باشد.`);
  return normalized;
}

function normalizePostalCode(value: string): string {
  const normalized = normalizeLocalizedDigits(value.normalize('NFKC')).replace(/\s/g, '');
  if (!/^\d{10}$/.test(normalized)) {
    throw new BadRequestException('کد پستی باید ۱۰ رقم باشد.');
  }
  return normalized;
}

function normalizeAddressId(addressId: string): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(addressId)) {
    throw new BadRequestException('شناسه آدرس معتبر نیست.');
  }
  return addressId;
}

function rethrowAddressMutationError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ConflictException('آدرس پیش‌فرض هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.');
  }
  throw error;
}

function normalizeCreateInput(input: AddressCreateInput) {
  return {
    label: normalizeText(input.label, 'عنوان آدرس'),
    recipientName: normalizeText(input.recipientName, 'نام تحویل‌گیرنده'),
    phone: normalizeIranianPhone(input.phone),
    province: normalizeText(input.province, 'استان'),
    city: normalizeText(input.city, 'شهر'),
    addressLine: normalizeText(input.addressLine, 'نشانی'),
    postalCode: normalizePostalCode(input.postalCode),
    isDefault: input.isDefault === true,
  };
}

function normalizeUpdateInput(input: AddressUpdateInput) {
  const normalized: {
    label?: string;
    recipientName?: string;
    phone?: string;
    province?: string;
    city?: string;
    addressLine?: string;
    postalCode?: string;
    isDefault?: boolean;
  } = {};

  if (input.label !== undefined) normalized.label = normalizeText(input.label, 'عنوان آدرس');
  if (input.recipientName !== undefined) {
    normalized.recipientName = normalizeText(input.recipientName, 'نام تحویل‌گیرنده');
  }
  if (input.phone !== undefined) normalized.phone = normalizeIranianPhone(input.phone);
  if (input.province !== undefined) normalized.province = normalizeText(input.province, 'استان');
  if (input.city !== undefined) normalized.city = normalizeText(input.city, 'شهر');
  if (input.addressLine !== undefined) {
    normalized.addressLine = normalizeText(input.addressLine, 'نشانی');
  }
  if (input.postalCode !== undefined) normalized.postalCode = normalizePostalCode(input.postalCode);
  if (input.isDefault !== undefined) normalized.isDefault = input.isDefault;

  if (Object.keys(normalized).length === 0) {
    throw new BadRequestException('حداقل یک تغییر برای آدرس وارد کنید.');
  }
  return normalized;
}

export function toCustomerAddress(source: AddressSource): CustomerAddress {
  return {
    id: source.id,
    label: source.label,
    recipientName: source.recipientName,
    phone: source.phone,
    province: source.province,
    city: source.city,
    addressLine: source.addressLine,
    postalCode: source.postalCode,
    isDefault: source.isDefault,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

@Injectable()
export class AddressService {
  public constructor(private readonly database: DatabaseService) {}

  public async list(userId: string): Promise<CustomerAddress[]> {
    const addresses = await this.database.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      select: addressSelect,
    });
    return addresses.map(toCustomerAddress);
  }

  public async get(userId: string, addressId: string): Promise<CustomerAddress> {
    const id = normalizeAddressId(addressId);
    const address = await this.database.prisma.address.findFirst({
      where: { id, userId },
      select: addressSelect,
    });
    if (!address) throw new NotFoundException('آدرس پیدا نشد.');
    return toCustomerAddress(address);
  }

  public async create(userId: string, input: AddressCreateInput): Promise<CustomerAddress> {
    const normalized = normalizeCreateInput(input);
    try {
      const address = await this.database.prisma.$transaction(async (transaction) => {
        const count = await transaction.address.count({ where: { userId } });
        const isDefault = normalized.isDefault || count === 0;

        if (isDefault) {
          await transaction.address.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
          });
        }

        return transaction.address.create({
          data: { userId, ...normalized, isDefault },
          select: addressSelect,
        });
      });

      return toCustomerAddress(address);
    } catch (error) {
      rethrowAddressMutationError(error);
    }
  }

  public async update(
    userId: string,
    addressId: string,
    input: AddressUpdateInput,
  ): Promise<CustomerAddress> {
    const id = normalizeAddressId(addressId);
    const normalized = normalizeUpdateInput(input);
    try {
      const address = await this.database.prisma.$transaction(async (transaction) => {
        const current = await transaction.address.findFirst({
          where: { id, userId },
          select: addressSelect,
        });
        if (!current) throw new NotFoundException('آدرس پیدا نشد.');

        if (normalized.isDefault === true) {
          await transaction.address.updateMany({
            where: { userId, isDefault: true, id: { not: id } },
            data: { isDefault: false },
          });
        } else if (normalized.isDefault === false && current.isDefault) {
          const replacement = await transaction.address.findFirst({
            where: { userId, id: { not: id } },
            orderBy: { updatedAt: 'desc' },
            select: { id: true },
          });
          if (!replacement) {
            throw new BadRequestException('حداقل یک آدرس باید پیش‌فرض بماند.');
          }
          await transaction.address.update({
            where: { id: replacement.id },
            data: { isDefault: true },
          });
        }

        return transaction.address.update({
          where: { id },
          data: normalized,
          select: addressSelect,
        });
      });

      return toCustomerAddress(address);
    } catch (error) {
      rethrowAddressMutationError(error);
    }
  }

  public async setDefault(userId: string, addressId: string): Promise<CustomerAddress> {
    const id = normalizeAddressId(addressId);
    try {
      const address = await this.database.prisma.$transaction(async (transaction) => {
        const current = await transaction.address.findFirst({
          where: { id, userId },
          select: { id: true },
        });
        if (!current) throw new NotFoundException('آدرس پیدا نشد.');

        await transaction.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
        return transaction.address.update({
          where: { id },
          data: { isDefault: true },
          select: addressSelect,
        });
      });

      return toCustomerAddress(address);
    } catch (error) {
      rethrowAddressMutationError(error);
    }
  }

  public async remove(userId: string, addressId: string): Promise<CustomerAddress[]> {
    const id = normalizeAddressId(addressId);
    await this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.address.findFirst({
        where: { id, userId },
        select: { id: true, isDefault: true },
      });
      if (!current) throw new NotFoundException('آدرس پیدا نشد.');

      await transaction.address.delete({ where: { id } });
      if (current.isDefault) {
        const replacement = await transaction.address.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          select: { id: true },
        });
        if (replacement) {
          await transaction.address.update({
            where: { id: replacement.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return this.list(userId);
  }
}
