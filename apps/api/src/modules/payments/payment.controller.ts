import { Body, Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import type { ApiEnvelope, PaymentCallbackResponse } from '@nova/api-client';

import { SkipCsrf } from '../../common/http/csrf.guard';
import type { RequestWithId } from '../../common/http/request-id.middleware';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  public constructor(private readonly payments: PaymentService) {}

  @Post(':provider/callback')
  @SkipCsrf()
  public async callback(
    @Param('provider') provider: string,
    @Body() payload: unknown,
    @Headers('x-payment-signature') signature: string | undefined,
    @Req() request: RequestWithId,
  ): Promise<ApiEnvelope<PaymentCallbackResponse>> {
    const result = await this.payments.handleCallback({ provider, payload, signature });
    return {
      data: result,
      meta: {
        requestId: request.requestId ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(':provider/callback')
  @SkipCsrf()
  public async callbackRedirect(
    @Param('provider') provider: string,
    @Query() payload: Record<string, string | undefined>,
    @Req() request: RequestWithId,
  ): Promise<ApiEnvelope<PaymentCallbackResponse>> {
    const result = await this.payments.handleCallback({ provider, payload });
    return {
      data: result,
      meta: {
        requestId: request.requestId ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
