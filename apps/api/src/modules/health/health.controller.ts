import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import type { HealthStatus } from '@nova/api-client';

import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  public constructor(private readonly healthService: HealthService) {}

  @Get('live')
  public live(): HealthStatus {
    return this.healthService.live();
  }

  @Get('ready')
  public async ready(): Promise<HealthStatus> {
    try {
      return await this.healthService.ready();
    } catch {
      throw new ServiceUnavailableException('سرویس برای دریافت ترافیک آماده نیست.');
    }
  }
}
