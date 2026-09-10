import { Injectable } from '@nestjs/common';
import { Prisma } from '@nova/db';
import type { ActorType, DatabaseClient } from '@nova/db';

import { DatabaseService } from '../../database/database.service';

export interface AuditEventInput {
  actorType: ActorType;
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

type AuditDatabase = DatabaseClient | Prisma.TransactionClient;

@Injectable()
export class AuditService {
  public constructor(private readonly database: DatabaseService) {}

  public async record(
    input: AuditEventInput,
    database: AuditDatabase = this.database.prisma,
  ): Promise<void> {
    await database.auditEvent.create({
      data: {
        actorType: input.actorType,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      },
    });
  }
}
