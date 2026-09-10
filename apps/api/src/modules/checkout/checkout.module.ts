import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AddressModule } from '../addresses/address.module';
import { AuthModule } from '../auth/auth.module';
import { CartModule } from '../cart/cart.module';
import { CouponsModule } from '../coupons/coupons.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentsModule } from '../payments/payments.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { FixedShippingProvider, SHIPPING_PROVIDER } from './shipping.provider';

@Module({
  imports: [AddressModule, AuthModule, CartModule, CouponsModule, DatabaseModule, InventoryModule, PaymentsModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, { provide: SHIPPING_PROVIDER, useClass: FixedShippingProvider }],
})
export class CheckoutModule {}
