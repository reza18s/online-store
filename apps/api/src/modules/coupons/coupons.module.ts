import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { StaffAuthModule } from '../staff-auth/staff-auth.module';
import { CouponService } from './coupon.service';
import { CouponsAdminController } from './coupons-admin.controller';

@Module({
  imports: [AuditModule, AuthModule, DatabaseModule, StaffAuthModule],
  controllers: [CouponsAdminController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponsModule {}
