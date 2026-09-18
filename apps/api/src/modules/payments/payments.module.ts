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
import { environment, type Environment } from '@nova/config';
import type { PaymentGateway } from '../checkout/payment.gateway';
import { LocalPaymentGateway } from './local.payment.gateway';
import { ZarinPalPaymentGateway } from './zarinpal.payment.gateway';

export function createPaymentGateway(
  config: Pick<
    Environment,
    | 'NODE_ENV'
    | 'WEB_ORIGIN'
    | 'AUTH_SECRET'
    | 'ZARINPAL_MERCHANT_ID'
    | 'ZARINPAL_BASE_URL'
    | 'ZARINPAL_SANDBOX'
  >,
): PaymentGateway {
  if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test') {
    return new LocalPaymentGateway({
      WEB_ORIGIN: config.WEB_ORIGIN,
      AUTH_SECRET: config.AUTH_SECRET,
    });
  }
  return new ZarinPalPaymentGateway(config);
}

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
      useFactory: () => createPaymentGateway(environment),
    },
  ],
  exports: [PAYMENT_GATEWAY, PaymentService],
})
export class PaymentsModule {}
