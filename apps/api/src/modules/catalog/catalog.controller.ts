import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type {
  AdminCatalogCategory,
  AdminCatalogProduct,
  AdminCatalogProductDetail,
  AdminCatalogProductListItem,
  AdminCatalogProductMedia,
  AdminCatalogProductOption,
  AdminCatalogProductOptionValue,
  AdminCatalogProductPage,
  AdminCatalogProductVariant,
  ApiEnvelope,
  CatalogCategory,
  CatalogFacets,
  CatalogProduct,
  CatalogProductPage,
  CatalogSearchSuggestion,
} from '@nova/api-client';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import {
  RequireStaffRoles,
  StaffAuthGuard,
  StaffRoleGuard,
  type StaffRequest,
} from '../staff-auth/staff-auth.guard';
import {
  CatalogAdminService,
  type CatalogAdminCategory,
  type CatalogAdminProductDetail,
  type CatalogAdminProductMedia,
  type CatalogAdminProductListItem,
  type CatalogAdminProductOption,
  type CatalogAdminProductOptionValue,
  type CatalogAdminProductVariant,
  type CatalogAdminProductView,
} from './catalog-admin.service';
import { AdminProductListQueryDto } from './dto/admin-product-list.query';
import { CatalogFacetQueryDto } from './dto/catalog-facet.query';
import {
  CreateAdminProductDto,
  CreateAdminProductMediaDto,
  CompleteAdminProductMediaDto,
  PresignAdminProductMediaDto,
  CreateAdminProductVariantDto,
  UpdateAdminProductDto,
  UpdateAdminProductMediaDto,
  UpdateAdminProductVariantDto,
} from './dto/admin-product.dto';
import type { CatalogMediaUploadPlan } from './catalog-media.storage';
import {
  CreateAdminCategoryDto,
  CreateAdminProductOptionDto,
  CreateAdminProductOptionValueDto,
  ReplaceProductCategoriesDto,
  UpdateAdminCategoryDto,
  UpdateAdminCategoryStatusDto,
  UpdateAdminProductOptionDto,
  UpdateAdminProductOptionValueDto,
} from './dto/admin-taxonomy.dto';
import { ProductListQueryDto } from './dto/product-list.query';
import { SearchSuggestionsQueryDto } from './dto/search-suggestions.query';
import { ProductIdParamsDto } from './dto/product-id.params';
import { ProductStatusDto } from './dto/product-status.dto';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  public constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  public async categories(@Req() request: RequestWithId): Promise<ApiEnvelope<CatalogCategory[]>> {
    return this.envelope(request, await this.catalog.listCategories());
  }

  @Get('facets')
  public async facets(
    @Query() query: CatalogFacetQueryDto,
    @Req() request: RequestWithId,
  ): Promise<ApiEnvelope<CatalogFacets>> {
    return this.envelope(request, await this.catalog.listFacets(query));
  }

  @Get('products')
  public async products(
    @Query() query: ProductListQueryDto,
    @Req() request: RequestWithId,
  ): Promise<ApiEnvelope<CatalogProductPage>> {
    return this.envelope(request, await this.catalog.listProducts(query));
  }

  @Get('products/:slug')
  public async product(
    @Param('slug') slug: string,
    @Req() request: RequestWithId,
  ): Promise<ApiEnvelope<CatalogProduct>> {
    return this.envelope(request, await this.catalog.getProduct(slug));
  }

  @Get('media/:mediaId')
  public async mediaAsset(
    @Param('mediaId') mediaId: string,
    @Res() response: { redirect(status: number, url: string): void },
  ): Promise<void> {
    response.redirect(302, await this.catalog.getMediaUrl(mediaId));
  }

  private envelope<T>(request: RequestWithId, data: T): ApiEnvelope<T> {
    return {
      data,
      meta: {
        requestId: request.requestId ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

@Controller('search')
export class CatalogSearchController {
  public constructor(private readonly catalog: CatalogService) {}

  @Get('suggestions')
  public async suggestions(
    @Query() query: SearchSuggestionsQueryDto,
    @Req() request: RequestWithId,
  ): Promise<ApiEnvelope<CatalogSearchSuggestion[]>> {
    return {
      data: await this.catalog.listSearchSuggestions(query),
      meta: {
        requestId: request.requestId ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get()
  public async search(
    @Query() query: ProductListQueryDto,
    @Req() request: RequestWithId,
  ): Promise<ApiEnvelope<CatalogProductPage>> {
    return {
      data: await this.catalog.listProducts(query),
      meta: {
        requestId: request.requestId ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

@Controller('admin/catalog')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
@RequireStaffRoles('admin')
export class CatalogAdminController {
  public constructor(private readonly catalog: CatalogAdminService) {}

  @Get('categories')
  @RequireStaffRoles('support', 'operations', 'admin')
  public async categories(
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogCategory[]>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      (await this.catalog.listCategories(request.staff)).map(toAdminCategoryResponse),
    );
  }

  @Post('categories')
  public async createCategory(
    @Body() body: CreateAdminCategoryDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogCategory>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      toAdminCategoryResponse(await this.catalog.createCategory(request.staff, body)),
    );
  }

  @Patch('categories/:categoryId')
  public async updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() body: UpdateAdminCategoryDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogCategory>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      toAdminCategoryResponse(await this.catalog.updateCategory(request.staff, categoryId, body)),
    );
  }

  @Patch('categories/:categoryId/status')
  public async updateCategoryStatus(
    @Param('categoryId') categoryId: string,
    @Body() body: UpdateAdminCategoryStatusDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogCategory>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      toAdminCategoryResponse(
        await this.catalog.updateCategoryStatus(request.staff, categoryId, body),
      ),
    );
  }

  @Get('products')
  @RequireStaffRoles('support', 'operations', 'admin')
  public async products(
    @Query() query: AdminProductListQueryDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductPage>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    const products = await this.catalog.listProducts(request.staff, query);
    return this.envelope(request, {
      items: products.items.map(toAdminProductListResponse),
      total: products.total,
      page: products.page,
      limit: products.limit,
    });
  }

  @Get('products/:productId')
  @RequireStaffRoles('support', 'operations', 'admin')
  public async productDetail(
    @Param() params: ProductIdParamsDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductDetail>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      toAdminProductDetailResponse(await this.catalog.getProduct(request.staff, params.productId)),
    );
  }

  @Post('products')
  public async createProduct(
    @Body() body: CreateAdminProductDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductDetail>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      toAdminProductDetailResponse(await this.catalog.createProduct(request.staff, body)),
    );
  }

  @Patch('products/:productId')
  public async updateProduct(
    @Param() params: ProductIdParamsDto,
    @Body() body: UpdateAdminProductDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductDetail>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      toAdminProductDetailResponse(
        await this.catalog.updateProduct(request.staff, params.productId, body),
      ),
    );
  }

  @Get('products/:productId/categories')
  @RequireStaffRoles('support', 'operations', 'admin')
  public async productCategories(
    @Param('productId') productId: string,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogCategory[]>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      (await this.catalog.listProductCategories(request.staff, productId)).map(
        toAdminCategoryResponse,
      ),
    );
  }

  @Put('products/:productId/categories')
  public async replaceProductCategories(
    @Param('productId') productId: string,
    @Body() body: ReplaceProductCategoriesDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogCategory[]>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      (await this.catalog.replaceProductCategories(request.staff, productId, body)).map(
        toAdminCategoryResponse,
      ),
    );
  }

  @Get('products/:productId/options')
  @RequireStaffRoles('support', 'operations', 'admin')
  public async options(
    @Param('productId') productId: string,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductOption[]>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      (await this.catalog.listOptions(request.staff, productId)).map(toAdminProductOptionResponse),
    );
  }

  @Post('products/:productId/options')
  public async createOption(
    @Param('productId') productId: string,
    @Body() body: CreateAdminProductOptionDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductOption>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      toAdminProductOptionResponse(await this.catalog.createOption(request.staff, productId, body)),
    );
  }

  @Patch('products/:productId/options/:optionId')
  public async updateOption(
    @Param('productId') productId: string,
    @Param('optionId') optionId: string,
    @Body() body: UpdateAdminProductOptionDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductOption>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      toAdminProductOptionResponse(
        await this.catalog.updateOption(request.staff, productId, optionId, body),
      ),
    );
  }

  @Post('products/:productId/options/:optionId/values')
  public async createOptionValue(
    @Param('productId') productId: string,
    @Param('optionId') optionId: string,
    @Body() body: CreateAdminProductOptionValueDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductOptionValue>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      toAdminProductOptionValueResponse(
        await this.catalog.createOptionValue(request.staff, productId, optionId, body),
      ),
    );
  }

  @Patch('products/:productId/options/:optionId/values/:valueId')
  public async updateOptionValue(
    @Param('productId') productId: string,
    @Param('optionId') optionId: string,
    @Param('valueId') valueId: string,
    @Body() body: UpdateAdminProductOptionValueDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductOptionValue>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      toAdminProductOptionValueResponse(
        await this.catalog.updateOptionValue(request.staff, productId, optionId, valueId, body),
      ),
    );
  }

  @Get('products/:productId/variants')
  @RequireStaffRoles('support', 'operations', 'admin')
  public async variants(
    @Param('productId') productId: string,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductVariant[]>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    const variants = await this.catalog.listVariants(request.staff, productId);
    return this.envelope(request, variants.map(toAdminProductVariantResponse));
  }

  @Post('products/:productId/variants')
  public async createVariant(
    @Param('productId') productId: string,
    @Body() body: CreateAdminProductVariantDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductVariant>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      toAdminProductVariantResponse(
        await this.catalog.createVariant(request.staff, productId, body),
      ),
    );
  }

  @Patch('products/:productId/variants/:variantId')
  public async updateVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() body: UpdateAdminProductVariantDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductVariant>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      toAdminProductVariantResponse(
        await this.catalog.updateVariant(request.staff, productId, variantId, body),
      ),
    );
  }

  @Get('products/:productId/media')
  @RequireStaffRoles('support', 'operations', 'admin')
  public async media(
    @Param('productId') productId: string,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductMedia[]>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    const media = await this.catalog.listMedia(request.staff, productId);
    return this.envelope(request, media.map(toAdminProductMediaResponse));
  }

  @Post('products/:productId/media/presign')
  public async presignMedia(
    @Param('productId') productId: string,
    @Body() body: PresignAdminProductMediaDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<CatalogMediaUploadPlan>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      await this.catalog.presignMedia(request.staff, productId, body),
    );
  }

  @Post('products/:productId/media/complete')
  public async completeMedia(
    @Param('productId') productId: string,
    @Body() body: CompleteAdminProductMediaDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductMedia>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      toAdminProductMediaResponse(
        await this.catalog.completeMedia(request.staff, productId, body),
      ),
    );
  }

  @Post('products/:productId/media')
  public async createMedia(
    @Param('productId') productId: string,
    @Body() body: CreateAdminProductMediaDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductMedia>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      toAdminProductMediaResponse(await this.catalog.createMedia(request.staff, productId, body)),
    );
  }

  @Patch('products/:productId/media/:mediaId')
  public async updateMedia(
    @Param('productId') productId: string,
    @Param('mediaId') mediaId: string,
    @Body() body: UpdateAdminProductMediaDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProductMedia>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      toAdminProductMediaResponse(
        await this.catalog.updateMedia(request.staff, productId, mediaId, body),
      ),
    );
  }

  @Delete('products/:productId/media/:mediaId')
  public async deleteMedia(
    @Param('productId') productId: string,
    @Param('mediaId') mediaId: string,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<{ deleted: true }>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(
      request,
      await this.catalog.deleteMedia(request.staff, productId, mediaId),
    );
  }

  @Patch('products/:productId/status')
  public async updateProductStatus(
    @Param() params: ProductIdParamsDto,
    @Body() body: ProductStatusDto,
    @Req() request: StaffRequest,
  ): Promise<ApiEnvelope<AdminCatalogProduct>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    const product = await this.catalog.updateProductStatus(
      request.staff,
      params.productId,
      body.status,
    );
    return this.envelope(request, toAdminProductResponse(product));
  }

  private envelope<T>(request: RequestWithId, data: T): ApiEnvelope<T> {
    return {
      data,
      meta: {
        requestId: request.requestId ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

function toAdminProductListResponse(
  source: CatalogAdminProductListItem,
): AdminCatalogProductListItem {
  return {
    ...toAdminProductResponse(source),
    basePriceToman: source.basePriceToman,
    compareAtPriceToman: source.compareAtPriceToman,
    categories: source.categories,
    primaryMedia: source.primaryMedia,
    inventory: source.inventory,
    variantCount: source.variantCount,
    mediaCount: source.mediaCount,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

function toAdminProductResponse(source: CatalogAdminProductView): AdminCatalogProduct {
  return {
    id: source.id,
    slug: source.slug,
    name: source.name,
    status: source.status,
    publishedAt: source.publishedAt?.toISOString() ?? null,
    archivedAt: source.archivedAt?.toISOString() ?? null,
  };
}

function toAdminProductDetailResponse(
  source: CatalogAdminProductDetail,
): AdminCatalogProductDetail {
  return {
    ...toAdminProductResponse(source),
    shortDescription: source.shortDescription,
    description: source.description,
    brand: source.brand,
    basePriceToman: source.basePriceToman,
    compareAtPriceToman: source.compareAtPriceToman,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

function toAdminProductVariantResponse(
  source: CatalogAdminProductVariant,
): AdminCatalogProductVariant {
  return {
    id: source.id,
    productId: source.productId,
    sku: source.sku,
    title: source.title,
    size: source.size,
    color: source.color,
    colorHex: source.colorHex,
    priceToman: source.priceToman,
    compareAtPriceToman: source.compareAtPriceToman,
    isActive: source.isActive,
    optionValueIds: source.optionValueIds,
    inventory: source.inventory,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

function toAdminCategoryResponse(source: CatalogAdminCategory): AdminCatalogCategory {
  return {
    id: source.id,
    slug: source.slug,
    name: source.name,
    description: source.description,
    parentId: source.parentId,
    archivedAt: source.archivedAt?.toISOString() ?? null,
    productCount: source.productCount,
    childCount: source.childCount,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

function toAdminProductOptionValueResponse(
  source: CatalogAdminProductOptionValue,
): AdminCatalogProductOptionValue {
  return { ...source };
}

function toAdminProductOptionResponse(
  source: CatalogAdminProductOption,
): AdminCatalogProductOption {
  return {
    ...source,
    values: source.values.map(toAdminProductOptionValueResponse),
  };
}

function toAdminProductMediaResponse(source: CatalogAdminProductMedia): AdminCatalogProductMedia {
  return {
    id: source.id,
    productId: source.productId,
    url: source.url,
    altText: source.altText,
    kind: source.kind,
    sortOrder: source.sortOrder,
    width: source.width,
    height: source.height,
  };
}
