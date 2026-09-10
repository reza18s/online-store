import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@nova/db';
import type { DatabaseClient } from '@nova/db';

import { DatabaseService } from '../../database/database.service';

export type PaymentNotificationKind = 'PAYMENT_SUCCEEDED' | 'PAYMENT_FAILED';

export interface EnqueueNotificationInput {
  kind: string;
  recipient: string;
  dedupeKey: string;
  payload: Prisma.InputJsonValue;
  availableAt?: Date;
}

export interface PaymentNotificationInput {
  kind: PaymentNotificationKind;
  paymentAttemptId: string;
  orderId: string;
  orderNumber: string;
  recipient: string;
  amountToman: number;
}

type NotificationDatabase = DatabaseClient | Prisma.TransactionClient;

const KIND_PATTERN = /^[A-Z][A-Z0-9_.:-]{0,63}$/;
const DEDUPE_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;

function assertBoundedText(value: string, message: string, maxLength: number): void {
  if (
    !value ||
    value.length > maxLength ||
    hasControlCharacter(value)
  ) {
    throw new BadRequestException(message);
  }
}

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if ((codePoint >= 0 && codePoint <= 31) || codePoint === 127) {
      return true;
    }
  }

  return false;
}

function assertPaymentAmount(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 2_147_483_647) {
    throw new BadRequestException('مبلغ اعلان پرداخت معتبر نیست.');
  }
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

@Injectable()
export class NotificationService {
  public constructor(private readonly database: DatabaseService) {}

  public async enqueue(
    input: EnqueueNotificationInput,
    database: NotificationDatabase = this.database.prisma,
  ): Promise<void> {
    if (!KIND_PATTERN.test(input.kind)) {
      throw new BadRequestException('نوع اعلان معتبر نیست.');
    }
    if (!DEDUPE_KEY_PATTERN.test(input.dedupeKey)) {
      throw new BadRequestException('کلید یکتای اعلان معتبر نیست.');
    }
    assertBoundedText(input.recipient, 'گیرنده اعلان معتبر نیست.', 320);

    try {
      await database.notificationJob.create({
        data: {
          kind: input.kind,
          recipient: input.recipient,
          dedupeKey: input.dedupeKey,
          payload: input.payload,
          ...(input.availableAt === undefined ? {} : { availableAt: input.availableAt }),
        },
        select: { id: true },
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // The dedupe key is the idempotency contract. A replay is already satisfied.
    }
  }

  public async enqueuePaymentEvent(
    input: PaymentNotificationInput,
    database: NotificationDatabase = this.database.prisma,
  ): Promise<void> {
    assertBoundedText(input.paymentAttemptId, 'شناسه تلاش پرداخت معتبر نیست.', 256);
    assertBoundedText(input.orderId, 'شناسه سفارش معتبر نیست.', 256);
    assertBoundedText(input.orderNumber, 'شماره سفارش معتبر نیست.', 128);
    assertPaymentAmount(input.amountToman);
    if (!input.recipient) return;

    await this.enqueue(
      {
        kind: input.kind,
        recipient: input.recipient,
        dedupeKey: `payment:${input.kind.toLowerCase()}:${input.paymentAttemptId}`,
        payload: {
          orderId: input.orderId,
          orderNumber: input.orderNumber,
          amountToman: input.amountToman,
          currency: 'TOMAN',
        },
      },
      database,
    );
  }
}
