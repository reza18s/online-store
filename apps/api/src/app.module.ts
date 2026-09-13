import { Module } from '@nestjs/common';

import { CsrfGuard } from './common/http/csrf.guard';
import { AuditModule } from './modules/audit/audit.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CartModule } from './modules/cart/cart.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { AddressModule } from './modules/addresses/address.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { StaffAuthModule } from './modules/staff-auth/staff-auth.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ContentModule } from './modules/content/content.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    AuditModule,
    CatalogModule,
    CartModule,
    HealthModule,
    InventoryModule,
    AuthModule,
    AddressModule,
    CheckoutModule,
    StaffAuthModule,
    OrdersModule,
    CustomersModule,
    ContentModule,
    DashboardModule,
  ],
  providers: [CsrfGuard],
})
export class AppModule {}
