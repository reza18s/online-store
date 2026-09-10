import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { StaffAuthModule } from '../staff-auth/staff-auth.module';
import { NotificationAdminController } from './notification-admin.controller';
import { NotificationAdminService } from './notification-admin.service';
import { NotificationService } from './notification.service';

@Module({
  imports: [AuthModule, DatabaseModule, StaffAuthModule],
  controllers: [NotificationAdminController],
  providers: [NotificationAdminService, NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
