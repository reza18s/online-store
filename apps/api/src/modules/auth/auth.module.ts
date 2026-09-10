import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CustomerAuthGuard } from './customer-auth.guard';
import { OTP_DELIVERY, UnconfiguredOtpDelivery } from './otp-delivery';
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
    { provide: OTP_DELIVERY, useClass: UnconfiguredOtpDelivery },
  ],
  exports: [AuthService, CustomerAuthGuard, SessionService, OTP_STATE_STORE],
})
export class AuthModule {}
