import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [AddressController],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
