import { Injectable } from '@nestjs/common';
import type { HealthStatus } from '@nova/api-client';

import { DatabaseService } from '../../database/database.service';

@Injectable()
export class HealthService {
  public constructor(private readonly database: DatabaseService) {}

  public live(): HealthStatus {
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
    };
  }

  public async ready(): Promise<HealthStatus> {
    await this.database.checkConnection();

    return {
      ...this.live(),
      database: 'ok',
    };
  }
}
