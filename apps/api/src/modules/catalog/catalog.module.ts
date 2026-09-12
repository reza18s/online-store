import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { StaffAuthModule } from '../staff-auth/staff-auth.module';
import {
  CatalogAdminController,
  CatalogController,
  CatalogSearchController,
} from './catalog.controller';
import { CatalogAdminService } from './catalog-admin.service';
import { CatalogService } from './catalog.service';
import { CATALOG_MEDIA_STORAGE, createCatalogMediaStorage } from './catalog-media.storage';

@Module({
  imports: [AuditModule, AuthModule, DatabaseModule, StaffAuthModule],
  controllers: [CatalogAdminController, CatalogController, CatalogSearchController],
  providers: [
    {
      provide: CATALOG_MEDIA_STORAGE,
      useFactory: createCatalogMediaStorage,
    },
    CatalogAdminService,
    CatalogService,
  ],
})
export class CatalogModule {}
