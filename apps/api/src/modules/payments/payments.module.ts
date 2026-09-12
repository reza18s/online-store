import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';
import { CouponsModule } from '../coupons/coupons.module';
import { InventoryModule } from '../inventory/inventory.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StaffAuthModule } from '../staff-auth/staff-auth.module';
import { PaymentAdminController } from './payment-admin.controller';
import { PaymentAdminService } from './payment-admin.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PAYMENT_GATEWAY } from '../checkout/payment.gateway';
import { environment } from '@nova/config';
import { ZarinPalPaymentGateway } from './zarinpal.payment.gateway';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    CouponsModule,
    DatabaseModule,
    InventoryModule,
    NotificationsModule,
    StaffAuthModule,
  ],
  controllers: [PaymentAdminController, PaymentController],
  providers: [
    PaymentAdminService,
    PaymentService,
    {
      provide: PAYMENT_GATEWAY,
      useFactory: () => new ZarinPalPaymentGateway(environment),
    },
  ],
  exports: [PAYMENT_GATEWAY, PaymentService],
})
export class PaymentsModule {}
