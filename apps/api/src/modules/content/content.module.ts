import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { StaffAuthModule } from '../staff-auth/staff-auth.module';
import {
  ContentController,
  RedirectAdminController,
  SeoController,
  SeoMetadataAdminController,
} from './content.controller';
import { ContentPageService } from './content-page.service';
import { ContentPageAdminController } from './content-page-admin.controller';
import { ContentPageAdminService } from './content-page-admin.service';
import { SeoService } from './seo.service';

@Module({
  imports: [AuditModule, AuthModule, DatabaseModule, StaffAuthModule],
  controllers: [
    ContentController,
    ContentPageAdminController,
    SeoController,
    SeoMetadataAdminController,
    RedirectAdminController,
  ],
  providers: [ContentPageAdminService, ContentPageService, SeoService],
})
export class ContentModule {}
