import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { StaffAuthModule } from '../staff-auth/staff-auth.module';
import { AuditAdminController } from './audit-admin.controller';
import { AuditAdminService } from './audit-admin.service';
import { AuditService } from './audit.service';

@Module({
  imports: [AuthModule, DatabaseModule, StaffAuthModule],
  controllers: [AuditAdminController],
  providers: [AuditAdminService, AuditService],
  exports: [AuditAdminService, AuditService],
})
export class AuditModule {}
