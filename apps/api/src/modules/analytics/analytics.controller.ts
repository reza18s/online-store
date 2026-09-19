import { Body, Controller, Post, Req } from '@nestjs/common';
import type { AnalyticsEventInput, ApiEnvelope } from '@nova/api-client';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import { requestCookie, type CustomerRequest } from '../auth/customer-auth.guard';
import { CUSTOMER_SESSION_COOKIE_NAME, SessionService } from '../auth/session.service';
import { AnalyticsService } from './analytics.service';
import { TrackAnalyticsEventDto } from './dto/track-analytics-event.dto';

@Controller('analytics')
export class AnalyticsController {
  public constructor(
    private readonly analytics: AnalyticsService,
    private readonly sessions: SessionService,
  ) {}

  @Post('events')
  public async record(
    @Req() request: CustomerRequest,
    @Body() body: TrackAnalyticsEventDto,
  ): Promise<ApiEnvelope<null>> {
    const session = await this.sessions.resolveCustomerSession(
      requestCookie(request, CUSTOMER_SESSION_COOKIE_NAME),
    );
    await this.analytics.record(body as AnalyticsEventInput, { userId: session?.user.id });
    return this.envelope(request, null);
  }

  private envelope<T>(request: RequestWithId, data: T): ApiEnvelope<T> {
    return {
      data,
      meta: {
        requestId: request.requestId ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
