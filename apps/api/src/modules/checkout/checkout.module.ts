import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AddressModule } from '../addresses/address.module';
import { AuthModule } from '../auth/auth.module';
import { CartModule } from '../cart/cart.module';
import { CouponsModule } from '../coupons/coupons.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentsModule } from '../payments/payments.module';
import { environment } from '@nova/config';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { SHIPPING_PROVIDER } from './shipping.provider';
import {
  createShippingProvider,
  TAPIN_SHIPPING_TRANSPORT,
  type TapinShippingTransport,
  UnconfiguredTapinShippingTransport,
} from './tapin-shipping.provider';

@Module({
  imports: [
    AddressModule,
    AuthModule,
    CartModule,
    CouponsModule,
    DatabaseModule,
    InventoryModule,
    PaymentsModule,
  ],
  controllers: [CheckoutController],
  providers: [
    CheckoutService,
    { provide: TAPIN_SHIPPING_TRANSPORT, useClass: UnconfiguredTapinShippingTransport },
    {
      provide: SHIPPING_PROVIDER,
      inject: [TAPIN_SHIPPING_TRANSPORT],
      useFactory: (transport: TapinShippingTransport) =>
        createShippingProvider(environment, transport),
    },
  ],
})
export class CheckoutModule {}
