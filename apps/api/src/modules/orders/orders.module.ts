import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { CouponsModule } from '../coupons/coupons.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentsModule } from '../payments/payments.module';
import { StaffAuthModule } from '../staff-auth/staff-auth.module';
import { OrdersController } from './orders.controller';
import { OrdersAdminController } from './orders-admin.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule, AuditModule, CouponsModule, DatabaseModule, InventoryModule, PaymentsModule, StaffAuthModule],
  controllers: [OrdersAdminController, OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
