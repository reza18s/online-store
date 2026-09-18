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
  IRAN_POST_SHIPPING_TRANSPORT,
  type IranPostShippingTransport,
  UnconfiguredIranPostShippingTransport,
} from './iran-post-shipping.provider';

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
    {
      provide: IRAN_POST_SHIPPING_TRANSPORT,
      useClass: UnconfiguredIranPostShippingTransport,
    },
    {
      provide: SHIPPING_PROVIDER,
      inject: [IRAN_POST_SHIPPING_TRANSPORT],
      useFactory: (transport: IranPostShippingTransport) =>
        createShippingProvider(environment, transport),
    },
  ],
})
export class CheckoutModule {}
