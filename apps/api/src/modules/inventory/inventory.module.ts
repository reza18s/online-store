import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { StaffAuthModule } from '../staff-auth/staff-auth.module';
import { InventoryAdminController } from './inventory.controller';
import { InventoryAdminService } from './inventory-admin.service';
import { InventoryService } from './inventory.service';

@Module({
  imports: [AuditModule, AuthModule, DatabaseModule, StaffAuthModule],
  controllers: [InventoryAdminController],
  providers: [InventoryAdminService, InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
