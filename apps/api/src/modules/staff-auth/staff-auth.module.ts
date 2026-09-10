import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { StaffAuthController } from './staff-auth.controller';
import { StaffAuthGuard, StaffRoleGuard } from './staff-auth.guard';
import { StaffAuthService } from './staff-auth.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [StaffAuthController],
  providers: [StaffAuthService, StaffAuthGuard, StaffRoleGuard],
  exports: [StaffAuthService, StaffAuthGuard, StaffRoleGuard],
})
export class StaffAuthModule {}
