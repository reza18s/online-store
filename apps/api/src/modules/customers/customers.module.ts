import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { StaffAuthModule } from '../staff-auth/staff-auth.module';
import { CustomerAdminController } from './customer-admin.controller';
import { CustomerAdminService } from './customer-admin.service';

@Module({
  imports: [AuthModule, DatabaseModule, StaffAuthModule],
  controllers: [CustomerAdminController],
  providers: [CustomerAdminService],
})
export class CustomersModule {}
