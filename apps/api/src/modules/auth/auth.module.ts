import { Module } from '@nestjs/common';
import { environment } from '@nova/config';

import { DatabaseModule } from '../../database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CustomerAuthGuard } from './customer-auth.guard';
import {
  isValidSmsIrOtpDeliveryConfig,
  OTP_DELIVERY,
  SmsIrOtpDelivery,
  UnconfiguredOtpDelivery,
} from './otp-delivery';
import { RedisOtpStateStore } from './redis-otp-state.store';
import { OTP_STATE_STORE } from './otp-state.store';
import { SessionService } from './session.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    CustomerAuthGuard,
    SessionService,
    RedisOtpStateStore,
    { provide: OTP_STATE_STORE, useExisting: RedisOtpStateStore },
    {
      provide: OTP_DELIVERY,
      useFactory: () =>
        isValidSmsIrOtpDeliveryConfig({
          apiKey: environment.SMS_IR_API_KEY,
          templateId: environment.SMS_IR_TEMPLATE_ID,
          baseUrl: environment.SMS_IR_BASE_URL,
          sandbox: environment.SMS_IR_SANDBOX,
        })
          ? new SmsIrOtpDelivery({
              apiKey: environment.SMS_IR_API_KEY,
              templateId: environment.SMS_IR_TEMPLATE_ID,
              baseUrl: environment.SMS_IR_BASE_URL,
              sandbox: environment.SMS_IR_SANDBOX,
            })
          : new UnconfiguredOtpDelivery(),
    },
  ],
  exports: [AuthService, CustomerAuthGuard, SessionService, OTP_STATE_STORE],
})
export class AuthModule {}
