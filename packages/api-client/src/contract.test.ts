import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Contract = {
  openapi: string;
  paths: Record<string, Record<string, Record<string, unknown>>>;
  components: {
    [key: string]: unknown;
    parameters: Record<string, Parameter>;
    requestBodies: Record<string, RequestBody>;
    schemas: Record<string, Schema>;
    responses: Record<string, Record<string, unknown>>;
    securitySchemes: Record<string, Record<string, unknown>>;
  };
};

type Schema = {
  type?: string | string[];
  properties?: Record<string, unknown>;
  required?: string[];
  enum?: unknown[];
  const?: unknown;
  allOf?: Array<{ $ref?: string; properties?: Record<string, unknown> }>;
  oneOf?: unknown[];
  items?: unknown;
  additionalProperties?: boolean | Record<string, unknown>;
  unevaluatedProperties?: boolean;
};

type Parameter = {
  $ref?: string;
  name?: string;
  in?: string;
  required?: boolean;
  schema?: Schema;
};

type RequestBody = {
  $ref?: string;
  required?: boolean;
  content?: Record<string, { schema?: Schema }>;
};

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = dirname(dirname(packageRoot));
const webSourceRoot = join(repositoryRoot, 'apps', 'web', 'src');
const contract = JSON.parse(readFileSync(join(packageRoot, 'openapi.json'), 'utf8')) as Contract;

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
const controllerRoot = join(repositoryRoot, 'apps', 'api', 'src', 'modules');

function controllerFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return controllerFiles(path);
    return entry.name.endsWith('.controller.ts') ? [path] : [];
  });
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

function joinRoute(prefix: string, route: string): string {
  const path = [prefix, route]
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/:([A-Za-z0-9_]+)/g, '{$1}');
  return path.startsWith('health/') ? `/${path}` : `/v1/${path}`;
}

function sourceRoutes(): Set<string> {
  const routes = new Set<string>();
  for (const file of controllerFiles(controllerRoot)) {
    const source = readFileSync(file, 'utf8');
    const controllers = source.matchAll(
      /@Controller\((['"])(.*?)\1\)([\s\S]*?)(?=@Controller\(|$)/g,
    );
    for (const controller of controllers) {
      const prefix = controller[2];
      const body = controller[3];
      assert.ok(prefix);
      assert.ok(body);
      for (const route of body.matchAll(/@(Get|Post|Put|Patch|Delete)\((?:(['"])(.*?)\2)?\)/g)) {
        const method = route[1];
        assert.ok(method);
        routes.add(`${method.toLowerCase()} ${joinRoute(prefix, route[3] ?? '')}`);
      }
    }
  }
  return routes;
}

function contractRoutes(): Set<string> {
  const routes = new Set<string>();
  for (const [path, operations] of Object.entries(contract.paths)) {
    for (const method of HTTP_METHODS) {
      if (operations[method]) routes.add(`${method} ${path}`);
    }
  }
  return routes;
}

function schemaFields(schemaName: string, seen = new Set<string>()): Set<string> {
  if (seen.has(schemaName)) return new Set();
  seen.add(schemaName);
  const schema = contract.components.schemas[schemaName];
  assert.ok(schema, `OpenAPI schema ${schemaName} is missing`);
  const fields = new Set(Object.keys(schema.properties ?? {}));
  for (const item of schema.allOf ?? []) {
    const refName = item.$ref?.split('/').pop();
    if (refName) for (const field of schemaFields(refName, seen)) fields.add(field);
    for (const field of Object.keys(item.properties ?? {})) fields.add(field);
  }
  return fields;
}

function refName(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const reference = (value as { $ref?: unknown }).$ref;
  return typeof reference === 'string' ? reference.split('/').pop() : undefined;
}

function schemaProperty(schemaName: string, field: string): Schema {
  const property = contract.components.schemas[schemaName]?.properties?.[field];
  assert.ok(property && typeof property === 'object', `${schemaName}.${field} is missing`);
  return property as Schema;
}

function operationEntries(): Array<{
  path: string;
  method: (typeof HTTP_METHODS)[number];
  operation: Record<string, unknown>;
}> {
  const entries: Array<{
    path: string;
    method: (typeof HTTP_METHODS)[number];
    operation: Record<string, unknown>;
  }> = [];
  for (const [path, operations] of Object.entries(contract.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = operations[method];
      if (operation) entries.push({ path, method, operation });
    }
  }
  return entries;
}

function resolveParameter(parameter: unknown): Parameter {
  if (!parameter || typeof parameter !== 'object')
    assert.fail('OpenAPI parameter is not an object');
  const candidate = parameter as Parameter;
  const name = refName(candidate);
  if (!name) return candidate;
  const resolved = contract.components.parameters[name];
  assert.ok(resolved, `OpenAPI parameter ${name} is missing`);
  return resolved;
}

function dtoRequiredFields(dtoName: string): Set<string> {
  const relativePath = dtoFiles[dtoName] ?? queryDtoFiles[dtoName];
  assert.ok(relativePath, `API DTO source for ${dtoName} is missing`);
  const source = readFileSync(join(repositoryRoot, relativePath), 'utf8');
  const declaration = new RegExp(`export class ${dtoName}\\s*\\{`);
  const match = declaration.exec(source);
  assert.ok(match, `API DTO ${dtoName} is missing`);
  const required = new Set<string>();
  for (const line of braceBody(source, match.index).split(/\r?\n/)) {
    const field = /^\s*public\s+([A-Za-z_$][\w$]*)\s*([!?])?\s*(?::[^=;]+)?\s*(=)?/.exec(line);
    if (field?.[1] && (field[2] === '!' || (field[2] !== '?' && field[3] === undefined))) {
      required.add(field[1]);
    }
  }
  return required;
}

function braceBody(source: string, start: number): string {
  const open = source.indexOf('{', start);
  assert.notEqual(open, -1);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  assert.fail('Unclosed TypeScript declaration');
}

function typeFields(typeName: string): Set<string> {
  const source = readFileSync(join(packageRoot, 'src', 'types.ts'), 'utf8');
  const declaration = new RegExp(`export interface ${typeName}(?: extends ([^{]+))?\\s*\\{`);
  const match = declaration.exec(source);
  assert.ok(match, `@nova/api-client interface ${typeName} is missing`);
  const fields = new Set<string>();
  for (const base of (match[1] ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)) {
    for (const field of typeFields(base)) fields.add(field);
  }
  for (const field of braceBody(source, match.index).matchAll(/^\s*([A-Za-z_$][\w$]*)\??\s*:/gm)) {
    const name = field[1];
    assert.ok(name);
    fields.add(name);
  }
  return fields;
}

const dtoSchemas: Record<string, string> = {
  CartItemMutationDto: 'CartItemMutation',
  CartItemQuantityDto: 'CartItemQuantity',
  CartMergeDto: 'CartMerge',
  CheckoutRequestDto: 'CheckoutRequest',
  CustomerOrderCancelDto: 'CustomerOrderCancel',
  CustomerReturnRequestDto: 'CustomerReturnRequest',
  AdminOrderStatusDto: 'AdminOrderStatus',
  AdminShipmentUpdateDto: 'AdminShipmentUpdate',
  AdminReturnReviewDto: 'AdminReturnReview',
  CreateAdminContentPageDto: 'CreateAdminContentPage',
  UpdateAdminContentPageDto: 'UpdateAdminContentPage',
  UpdateAdminContentPageStatusDto: 'UpdateAdminContentPageStatus',
};

const dtoFiles: Record<string, string> = {
  CartItemMutationDto: 'apps/api/src/modules/cart/dto/cart-item.mutation.ts',
  CartItemQuantityDto: 'apps/api/src/modules/cart/dto/cart-item.mutation.ts',
  CartMergeDto: 'apps/api/src/modules/cart/dto/cart-merge.mutation.ts',
  CheckoutRequestDto: 'apps/api/src/modules/checkout/dto/checkout.dto.ts',
  CustomerOrderCancelDto: 'apps/api/src/modules/orders/dto/customer-order-cancel.dto.ts',
  CustomerReturnRequestDto: 'apps/api/src/modules/orders/dto/customer-return-request.dto.ts',
  AdminOrderStatusDto: 'apps/api/src/modules/orders/dto/admin-order-status.dto.ts',
  AdminShipmentUpdateDto: 'apps/api/src/modules/orders/dto/admin-shipment.dto.ts',
  AdminReturnReviewDto: 'apps/api/src/modules/orders/dto/admin-return-review.dto.ts',
  CreateAdminContentPageDto: 'apps/api/src/modules/content/dto/admin-content-page.dto.ts',
  UpdateAdminContentPageDto: 'apps/api/src/modules/content/dto/admin-content-page.dto.ts',
  UpdateAdminContentPageStatusDto: 'apps/api/src/modules/content/dto/admin-content-page.dto.ts',
  CreateAdminSeoMetadataDto: 'apps/api/src/modules/content/dto/seo.dto.ts',
  UpdateAdminSeoMetadataDto: 'apps/api/src/modules/content/dto/seo.dto.ts',
  CreateAdminRedirectDto: 'apps/api/src/modules/content/dto/seo.dto.ts',
  UpdateAdminRedirectDto: 'apps/api/src/modules/content/dto/seo.dto.ts',
};

Object.assign(dtoSchemas, {
  CreateAdminSeoMetadataDto: 'CreateAdminSeoMetadata',
  UpdateAdminSeoMetadataDto: 'UpdateAdminSeoMetadata',
  CreateAdminRedirectDto: 'CreateAdminRedirect',
  UpdateAdminRedirectDto: 'UpdateAdminRedirect',
  AddressCreateDto: 'AddressCreate',
  AddressUpdateDto: 'AddressUpdate',
  OtpRequestDto: 'OtpRequest',
  OtpVerifyDto: 'OtpVerify',
  StaffLoginDto: 'StaffLogin',
  CreateAdminCategoryDto: 'CreateAdminCategory',
  UpdateAdminCategoryDto: 'UpdateAdminCategory',
  UpdateAdminCategoryStatusDto: 'UpdateAdminCategoryStatus',
  CreateAdminProductDto: 'CreateAdminProduct',
  UpdateAdminProductDto: 'UpdateAdminProduct',
  ReplaceProductCategoriesDto: 'ReplaceProductCategories',
  CreateAdminProductOptionDto: 'CreateAdminProductOption',
  UpdateAdminProductOptionDto: 'UpdateAdminProductOption',
  CreateAdminProductOptionValueDto: 'CreateAdminProductOptionValue',
  UpdateAdminProductOptionValueDto: 'UpdateAdminProductOptionValue',
  CreateAdminProductVariantDto: 'CreateAdminProductVariant',
  UpdateAdminProductVariantDto: 'UpdateAdminProductVariant',
  CreateAdminProductMediaDto: 'CreateAdminProductMedia',
  UpdateAdminProductMediaDto: 'UpdateAdminProductMedia',
  ProductStatusDto: 'ProductStatus',
  AdminInventoryAdjustmentDto: 'AdminInventoryAdjustment',
  AdminInventoryReorderPointDto: 'AdminInventoryReorderPoint',
  CreateAdminCouponDto: 'CreateAdminCoupon',
  UpdateAdminCouponDto: 'UpdateAdminCoupon',
});

Object.assign(dtoFiles, {
  AddressCreateDto: 'apps/api/src/modules/addresses/dto/address.dto.ts',
  AddressUpdateDto: 'apps/api/src/modules/addresses/dto/address.dto.ts',
  OtpRequestDto: 'apps/api/src/modules/auth/dto/auth.dto.ts',
  OtpVerifyDto: 'apps/api/src/modules/auth/dto/auth.dto.ts',
  StaffLoginDto: 'apps/api/src/modules/staff-auth/dto/staff-login.dto.ts',
  CreateAdminCategoryDto: 'apps/api/src/modules/catalog/dto/admin-taxonomy.dto.ts',
  UpdateAdminCategoryDto: 'apps/api/src/modules/catalog/dto/admin-taxonomy.dto.ts',
  UpdateAdminCategoryStatusDto: 'apps/api/src/modules/catalog/dto/admin-taxonomy.dto.ts',
  CreateAdminProductDto: 'apps/api/src/modules/catalog/dto/admin-product.dto.ts',
  UpdateAdminProductDto: 'apps/api/src/modules/catalog/dto/admin-product.dto.ts',
  ReplaceProductCategoriesDto: 'apps/api/src/modules/catalog/dto/admin-taxonomy.dto.ts',
  CreateAdminProductOptionDto: 'apps/api/src/modules/catalog/dto/admin-taxonomy.dto.ts',
  UpdateAdminProductOptionDto: 'apps/api/src/modules/catalog/dto/admin-taxonomy.dto.ts',
  CreateAdminProductOptionValueDto: 'apps/api/src/modules/catalog/dto/admin-taxonomy.dto.ts',
  UpdateAdminProductOptionValueDto: 'apps/api/src/modules/catalog/dto/admin-taxonomy.dto.ts',
  CreateAdminProductVariantDto: 'apps/api/src/modules/catalog/dto/admin-product.dto.ts',
  UpdateAdminProductVariantDto: 'apps/api/src/modules/catalog/dto/admin-product.dto.ts',
  CreateAdminProductMediaDto: 'apps/api/src/modules/catalog/dto/admin-product.dto.ts',
  UpdateAdminProductMediaDto: 'apps/api/src/modules/catalog/dto/admin-product.dto.ts',
  ProductStatusDto: 'apps/api/src/modules/catalog/dto/product-status.dto.ts',
  AdminInventoryAdjustmentDto: 'apps/api/src/modules/inventory/dto/admin-inventory.dto.ts',
  AdminInventoryReorderPointDto: 'apps/api/src/modules/inventory/dto/admin-inventory.dto.ts',
  CreateAdminCouponDto: 'apps/api/src/modules/coupons/dto/admin-coupon.dto.ts',
  UpdateAdminCouponDto: 'apps/api/src/modules/coupons/dto/admin-coupon.dto.ts',
});

const queryDtoSchemas: Record<string, string> = {
  CatalogFacetQueryDto: 'CatalogFacetQuery',
  ProductListQueryDto: 'ProductListQuery',
  SearchSuggestionsQueryDto: 'SearchSuggestionsQuery',
  CustomerOrderListQueryDto: 'CustomerOrderListQuery',
  AdminOrderListQueryDto: 'AdminOrderListQuery',
  AdminPaymentListQueryDto: 'AdminPaymentListQuery',
  AdminContentPageListQueryDto: 'AdminContentPageListQuery',
  AdminContentListQueryDto: 'AdminContentListQuery',
  SeoResolveQueryDto: 'SeoResolveQuery',
};

const queryDtoFiles: Record<string, string> = {
  CatalogFacetQueryDto: 'apps/api/src/modules/catalog/dto/catalog-facet.query.ts',
  ProductListQueryDto: 'apps/api/src/modules/catalog/dto/product-list.query.ts',
  SearchSuggestionsQueryDto: 'apps/api/src/modules/catalog/dto/search-suggestions.query.ts',
  CustomerOrderListQueryDto: 'apps/api/src/modules/orders/dto/order-list.query.ts',
  AdminOrderListQueryDto: 'apps/api/src/modules/orders/dto/admin-order-list.query.ts',
  AdminPaymentListQueryDto: 'apps/api/src/modules/payments/dto/admin-payment-list.query.ts',
  AdminContentPageListQueryDto: 'apps/api/src/modules/content/dto/admin-content-page.query.ts',
  AdminContentListQueryDto: 'apps/api/src/modules/content/dto/seo.query.ts',
  SeoResolveQueryDto: 'apps/api/src/modules/content/dto/seo.query.ts',
};

Object.assign(queryDtoSchemas, {
  AdminProductListQueryDto: 'AdminProductListQuery',
  AdminInventoryListQueryDto: 'AdminInventoryListQuery',
  AdminAuditListQueryDto: 'AdminAuditListQuery',
  AdminCouponListQueryDto: 'AdminCouponListQuery',
  AdminCustomerListQueryDto: 'AdminCustomerListQuery',
  AdminNotificationListQueryDto: 'AdminNotificationListQuery',
});

Object.assign(queryDtoFiles, {
  AdminProductListQueryDto: 'apps/api/src/modules/catalog/dto/admin-product-list.query.ts',
  AdminInventoryListQueryDto: 'apps/api/src/modules/inventory/dto/admin-inventory.query.ts',
  AdminAuditListQueryDto: 'apps/api/src/modules/audit/dto/admin-audit-list.query.ts',
  AdminCouponListQueryDto: 'apps/api/src/modules/coupons/dto/admin-coupon.query.ts',
  AdminCustomerListQueryDto: 'apps/api/src/modules/customers/dto/admin-customer-list.query.ts',
  AdminNotificationListQueryDto:
    'apps/api/src/modules/notifications/dto/admin-notification-list.query.ts',
});

function dtoFields(dtoName: string): Set<string> {
  const relativePath = dtoFiles[dtoName] ?? queryDtoFiles[dtoName];
  assert.ok(relativePath, `API DTO source for ${dtoName} is missing`);
  const source = readFileSync(join(repositoryRoot, relativePath), 'utf8');
  const declaration = new RegExp(`export class ${dtoName}\\s*\\{`);
  const match = declaration.exec(source);
  assert.ok(match, `API DTO ${dtoName} is missing`);
  return new Set(
    [
      ...braceBody(source, match.index).matchAll(
        /^\s*public\s+([A-Za-z_$][\w$]*)[!?]?\s*(?::|=)/gm,
      ),
    ].map((field) => {
      const name = field[1];
      assert.ok(name);
      return name;
    }),
  );
}

test('OpenAPI route inventory matches every Nest controller route', () => {
  assert.equal(contract.openapi, '3.1.0');
  assert.deepEqual([...contractRoutes()].sort(), [...sourceRoutes()].sort());
});

test('public content index is complete, published-only, and separate from the detail route', () => {
  const index = contract.paths['/v1/content/pages']?.get;
  assert.ok(index, 'published content index route is missing');
  assert.equal(index.operationId, 'contentPageIndex');
  assert.deepEqual(index.security, []);
  assert.equal(refName((index.responses as Record<string, unknown>)?.['200']), 'ContentPageIndex');
  assert.equal(refName((index.responses as Record<string, unknown>)?.default), 'ApiError500');
  assert.equal(refName((index.responses as Record<string, unknown>)?.['400']), 'ApiError400');
  assert.equal(contract.paths['/v1/content/pages/{slug}']?.get?.operationId, 'contentPage');

  assert.deepEqual([...schemaFields('ContentPageSummary')].sort(), ['slug', 'title', 'updatedAt']);
  assert.equal(schemaFields('ContentPageSummary').has('body'), false);
  assert.equal(schemaFields('ContentPageSummary').has('blocks'), false);
  assert.deepEqual(contract.components.schemas.ContentPageIndex, {
    type: 'array',
    items: { $ref: '#/components/schemas/ContentPageSummary' },
  });
  assert.equal(
    refName((contract.components.schemas.ApiEnvelopeContentPageIndex as Schema).properties?.data),
    'ContentPageIndex',
  );
});

test('frontend API transport paths resolve to inventoried contract routes', () => {
  const paths = new Set<string>();
  for (const file of sourceFiles(webSourceRoot)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/["'`](\/(?:v1|health)\/[^"'`\r\n]*)["'`]/g)) {
      const rawPath = match[1];
      if (typeof rawPath !== 'string') assert.fail('frontend path capture is missing');
      const path = rawPath
        .replace(/\$\{[^}]+\}/g, (_expression, offset: number, value: string) =>
          value[offset - 1] === '/' ? '{param}' : '',
        )
        .split('?')[0]!
        .replace(/\/$/, '');
      paths.add(path);
    }
  }

  for (const path of paths) {
    const matchesContract = Object.keys(contract.paths).some((candidate) => {
      const pattern = new RegExp(`^${candidate.replace(/\{[^}]+\}/g, '[^/]+')}$`);
      return pattern.test(path) || candidate.startsWith(`${path}/{`);
    });
    assert.ok(matchesContract, `frontend path ${path} is absent from the OpenAPI route inventory`);
  }
});

test('all OpenAPI references resolve inside the contract document', () => {
  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === '$ref') {
        if (typeof child !== 'string')
          assert.fail(`OpenAPI $ref must be a string: ${String(child)}`);
        assert.ok(child.startsWith('#/'), `external OpenAPI reference ${child} is not allowed`);
        let target: unknown = contract as unknown;
        for (const part of child
          .slice(2)
          .split('/')
          .map((item) => item.replace(/~1/g, '/'))) {
          assert.ok(
            target && typeof target === 'object' && part in target,
            `unresolved OpenAPI reference ${child}`,
          );
          target = (target as Record<string, unknown>)[part];
        }
        assert.notEqual(target, undefined, `unresolved OpenAPI reference ${child}`);
      } else {
        visit(child);
      }
    }
  }
  visit(contract);
});

test('covered request DTOs and client interfaces match OpenAPI field sets', () => {
  for (const [dtoName, schemaName] of Object.entries(dtoSchemas)) {
    assert.deepEqual([...schemaFields(schemaName)].sort(), [...dtoFields(dtoName)].sort(), dtoName);
  }

  for (const [dtoName, schemaName] of Object.entries(queryDtoSchemas)) {
    assert.deepEqual([...schemaFields(schemaName)].sort(), [...dtoFields(dtoName)].sort(), dtoName);
  }

  const clientSchemas: Record<string, string> = {
    ApiMeta: 'ApiMeta',
    ApiErrorPayload: 'ApiErrorPayload',
    CartLine: 'CartLine',
    CartView: 'CartView',
    CartMergeConflict: 'CartMergeConflict',
    CheckoutQuoteLine: 'CheckoutQuoteLine',
    CheckoutQuote: 'CheckoutQuote',
    CheckoutPayment: 'CheckoutPayment',
    CheckoutOrder: 'CheckoutOrder',
    CustomerOrderSummary: 'CustomerOrderSummary',
    CustomerOrderPage: 'CustomerOrderPage',
    CustomerOrderPayment: 'CustomerOrderPayment',
    CustomerOrderDetail: 'CustomerOrderDetail',
    AdminOrderSummary: 'AdminOrderSummary',
    AdminOrderPage: 'AdminOrderPage',
    AdminOrderPayment: 'AdminOrderPayment',
    AdminOrderDetail: 'AdminOrderDetail',
    AdminPaymentAttempt: 'AdminPaymentAttempt',
    AdminPaymentPage: 'AdminPaymentPage',
    ContentBlock: 'ContentBlock',
    ContentPage: 'ContentPage',
    ContentPageSummary: 'ContentPageSummary',
    AdminContentPageListItem: 'AdminContentPageListItem',
    AdminContentPage: 'AdminContentPage',
    AdminContentPagePage: 'AdminContentPagePage',
    CatalogFacets: 'CatalogFacets',
    CatalogProductPage: 'CatalogProductPage',
  };
  for (const [typeName, schemaName] of Object.entries(clientSchemas)) {
    assert.deepEqual(
      [...schemaFields(schemaName)].sort(),
      [...typeFields(typeName)].sort(),
      typeName,
    );
  }
});

test('admin order payment contracts exclude redirectUrl while customer and checkout retain it', () => {
  const adminOrderDetail = contract.components.schemas.AdminOrderDetail;
  assert.ok(adminOrderDetail);
  assert.equal(schemaFields('AdminOrderDetail').has('redirectUrl'), false);
  assert.equal(adminOrderDetail.required?.includes('redirectUrl'), false);
  assert.doesNotMatch(JSON.stringify(adminOrderDetail), /redirectUrl/);
  assert.equal(schemaFields('AdminOrderPayment').has('redirectUrl'), false);
  const adminOrderPayment = contract.components.schemas.AdminOrderPayment;
  assert.ok(adminOrderPayment);
  assert.equal(adminOrderPayment.required?.includes('redirectUrl'), false);

  for (const schemaName of ['CustomerOrderPayment', 'CheckoutPayment']) {
    const paymentSchema = contract.components.schemas[schemaName];
    assert.ok(paymentSchema);
    assert.equal(schemaFields(schemaName).has('redirectUrl'), true, schemaName);
    assert.equal(paymentSchema.required?.includes('redirectUrl'), true, schemaName);
  }
});

test('the stable error envelope and covered operations are explicit', () => {
  assert.deepEqual([...schemaFields('ApiErrorEnvelope')].sort(), ['error']);
  assert.deepEqual([...schemaFields('ApiErrorPayload')].sort(), [
    'code',
    'details',
    'message',
    'requestId',
    'statusCode',
    'timestamp',
  ]);
  assert.deepEqual(contract.components['x-nova-error-codes'], [
    'VALIDATION_ERROR',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'CONFLICT',
    'CART_MERGE_CONFLICT',
    'RATE_LIMITED',
    'SERVICE_UNAVAILABLE',
    'INTERNAL_ERROR',
  ]);
  for (const operations of Object.values(contract.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = operations[method];
      if (!operation) continue;
      assert.ok(operation.responses, `${method} operation has no responses`);
      assert.ok(operation.operationId, `${method} operation has no operationId`);
      const dtoName = operation['x-nova-request-dto'] ?? operation['x-nova-query-dto'];
      if (typeof dtoName === 'string') {
        const schemaName = dtoSchemas[dtoName] ?? queryDtoSchemas[dtoName];
        assert.ok(schemaName, `${dtoName} is not mapped to a contract schema`);
        assert.ok(contract.components.schemas[schemaName], `${schemaName} schema is missing`);
      }
    }
  }
});

test('closed schemas do not use invalid allOf composition', () => {
  for (const [schemaName, schema] of Object.entries(contract.components.schemas)) {
    for (const item of schema.allOf ?? []) {
      const baseName = refName(item);
      if (!baseName) continue;
      const base = contract.components.schemas[baseName];
      assert.ok(base, `${schemaName} allOf base ${baseName} is missing`);
      assert.notEqual(
        base.additionalProperties,
        false,
        `${schemaName} cannot extend closed ${baseName} with allOf; use direct properties or unevaluatedProperties`,
      );
    }
  }

  for (const schemaName of ['CatalogProduct', 'AdminContentBlock', 'AdminSeoMetadata']) {
    assert.equal(
      contract.components.schemas[schemaName]?.allOf,
      undefined,
      `${schemaName} must describe its complete closed response shape`,
    );
    assert.equal(contract.components.schemas[schemaName]?.additionalProperties, false);
  }
});

test('every OpenAPI path template has a required standard path parameter', () => {
  for (const { path, method, operation } of operationEntries()) {
    const parameters = Array.isArray(operation.parameters) ? operation.parameters : [];
    for (const match of path.matchAll(/\{([^}]+)\}/g)) {
      const name = match[1];
      assert.ok(name, `${method} ${path} has an empty path template`);
      const parameter = parameters
        .map(resolveParameter)
        .find((candidate) => candidate.name === name);
      assert.ok(parameter, `${method} ${path} is missing standard path parameter ${name}`);
      assert.equal(parameter.in, 'path', `${method} ${path} parameter ${name} must be in:path`);
      assert.equal(
        parameter.required,
        true,
        `${method} ${path} parameter ${name} must be required`,
      );
      assert.ok(parameter.schema, `${method} ${path} parameter ${name} has no schema`);
    }
  }
});

test('standard security, CSRF, and idempotency metadata matches producer enforcement', () => {
  assert.deepEqual(Object.keys(contract.components.securitySchemes).sort(), [
    'csrfToken',
    'customerSession',
    'staffSession',
  ]);
  assert.deepEqual(
    {
      customerSession: contract.components.securitySchemes.customerSession,
      staffSession: contract.components.securitySchemes.staffSession,
      csrfToken: contract.components.securitySchemes.csrfToken,
    },
    {
      customerSession: expectSecurityScheme('cookie', 'nova_session'),
      staffSession: expectSecurityScheme('cookie', 'nova_staff_session'),
      csrfToken: expectSecurityScheme('header', 'x-csrf-token'),
    },
  );

  for (const { method, operation } of operationEntries()) {
    const security = operation.security;
    assert.ok(Array.isArray(security), `${operation.operationId} must declare standard security`);
    const csrf = operation['x-nova-csrf'];
    assert.ok(
      csrf && typeof csrf === 'object',
      `${operation.operationId} must declare CSRF metadata`,
    );
    const unsafe = ['post', 'put', 'patch', 'delete'].includes(method);
    if (operation.operationId === 'paymentCallback') {
      assert.deepEqual(security, []);
      assert.equal((csrf as Record<string, unknown>).skipped, true);
      assert.equal((csrf as Record<string, unknown>).required, false);
      continue;
    }
    if (unsafe) {
      assert.equal(
        (csrf as Record<string, unknown>).required,
        true,
        `${operation.operationId} CSRF requirement drift`,
      );
      assert.ok(
        (security as Array<Record<string, unknown>>).some((item) => 'csrfToken' in item),
        `${operation.operationId} must require csrfToken in standard security`,
      );
    } else {
      assert.equal(
        (csrf as Record<string, unknown>).required,
        false,
        `${operation.operationId} safe CSRF drift`,
      );
    }

    const auth = operation['x-nova-auth'];
    if (typeof auth === 'string') {
      const requirement = operation['x-nova-auth-requirement'];
      assert.ok(
        requirement && typeof requirement === 'object',
        `${operation.operationId} auth metadata is not machine-readable`,
      );
      const requirementRecord = requirement as Record<string, unknown>;
      assert.equal(requirementRecord.principal, auth === 'customer' ? 'customer' : 'staff');
      const scheme = auth === 'customer' ? 'customerSession' : 'staffSession';
      assert.ok(
        (security as Array<Record<string, unknown>>).some((item) => scheme in item),
        `${operation.operationId} is missing ${scheme} security`,
      );
    }

    if (operation['x-nova-idempotency-key']) {
      const idempotency = operation['x-nova-idempotency'];
      assert.ok(
        idempotency && typeof idempotency === 'object',
        `${operation.operationId} idempotency metadata is incomplete`,
      );
      const required = (idempotency as Record<string, unknown>).required;
      const parameter = (operation.parameters as unknown[])
        .map(resolveParameter)
        .find((candidate) => candidate.in === 'header' && candidate.name === 'idempotency-key');
      assert.ok(parameter, `${operation.operationId} is missing standard idempotency-key header`);
      assert.equal(
        parameter.required,
        required,
        `${operation.operationId} idempotency requiredness drift`,
      );
    }
  }
});

function expectSecurityScheme(inValue: string, name: string): Record<string, unknown> {
  return {
    type: 'apiKey',
    in: inValue,
    name,
    description:
      contract.components.securitySchemes[
        name === 'nova_session'
          ? 'customerSession'
          : name === 'nova_staff_session'
            ? 'staffSession'
            : 'csrfToken'
      ]?.description,
  };
}

test('x-nova-query-dto fields are connected to standard query parameters with DTO defaults', () => {
  for (const { method, path, operation } of operationEntries()) {
    const dtoName = operation['x-nova-query-dto'];
    if (typeof dtoName !== 'string') continue;
    const schemaName = queryDtoSchemas[dtoName];
    assert.ok(schemaName, `${dtoName} has no query schema mapping`);
    const queryParameters = (Array.isArray(operation.parameters) ? operation.parameters : [])
      .map(resolveParameter)
      .filter((parameter) => parameter.in === 'query');
    assert.deepEqual(
      queryParameters.map((parameter) => parameter.name).sort(),
      [...dtoFields(dtoName)].sort(),
      `${method} ${path} query parameter inventory drift for ${dtoName}`,
    );
    const querySchema = contract.components.schemas[schemaName];
    assert.ok(querySchema, `${schemaName} query schema is missing`);
    assert.deepEqual(
      (querySchema.required ?? []).sort(),
      [...dtoRequiredFields(dtoName)].sort(),
      `${dtoName} schema requiredness drift`,
    );
    const properties = querySchema.properties ?? {};
    for (const parameter of queryParameters) {
      assert.deepEqual(
        parameter.schema,
        properties[parameter.name ?? ''],
        `${dtoName}.${parameter.name} standard parameter schema drift`,
      );
      assert.equal(
        parameter.required,
        dtoRequiredFields(dtoName).has(parameter.name ?? ''),
        `${dtoName}.${parameter.name} requiredness drift`,
      );
    }
  }
});

test('request DTOs and SEO mutations use standard request bodies', () => {
  for (const { operation } of operationEntries()) {
    const dtoName = operation['x-nova-request-dto'];
    if (typeof dtoName !== 'string') continue;
    const requestBody = operation.requestBody;
    assert.ok(
      requestBody && typeof requestBody === 'object',
      `${operation.operationId} has no requestBody`,
    );
    const bodyName = refName(requestBody);
    assert.ok(bodyName, `${operation.operationId} requestBody must be a local component reference`);
    const body = contract.components.requestBodies[bodyName];
    assert.ok(body, `${operation.operationId} request body component ${bodyName} is missing`);
    assert.equal(body.required, true, `${operation.operationId} request body must be required`);
    const schema = body.content?.['application/json']?.schema;
    assert.equal(
      refName(schema),
      dtoSchemas[dtoName],
      `${operation.operationId} request schema drift`,
    );
  }

  for (const operationId of [
    'adminSeoMetadataCreate',
    'adminSeoMetadataUpdate',
    'adminRedirectCreate',
    'adminRedirectUpdate',
  ]) {
    const operation = operationEntries().find(
      (entry) => entry.operation.operationId === operationId,
    )?.operation;
    assert.ok(operation?.requestBody, `${operationId} must expose a standard requestBody`);
  }
});

test('detailed operations connect shared error responses and filter statuses', () => {
  for (const { method, operation } of operationEntries()) {
    const responses = operation.responses as Record<string, unknown> | undefined;
    assert.equal(
      (responses?.default as { $ref?: string } | undefined)?.$ref,
      '#/components/responses/ApiError500',
      `${method} ${operation.operationId} must document the default filter envelope`,
    );
    assert.equal(
      (responses?.['400'] as { $ref?: string } | undefined)?.$ref,
      '#/components/responses/ApiError400',
      `${method} ${operation.operationId} must document validation errors`,
    );
  }

  for (const status of ['400', '401', '403', '404', '409', '422', '429', '500', '503']) {
    const response = contract.components.responses[`ApiError${status}`];
    if (!response) continue;
    const content = response.content as Record<string, { schema?: unknown }> | undefined;
    const schema = content?.['application/json']?.schema;
    assert.equal(
      refName(schema),
      'ApiErrorEnvelope',
      `ApiError${status} must use ApiErrorEnvelope`,
    );
  }
  assert.ok(
    contract.components.responses.ApiError422,
    'ApiExceptionFilter 422 mapping must be documented',
  );
});

function arrayItemRef(schema: Schema): string | undefined {
  return refName(schema.items);
}

test('nested response shapes and enums match the producer/client contract', () => {
  assert.equal(arrayItemRef(schemaProperty('ProductSummary', 'options')), 'CatalogProductOption');
  assert.equal(arrayItemRef(schemaProperty('ProductSummary', 'colors')), 'CatalogProductColor');
  assert.equal(arrayItemRef(schemaProperty('ProductSummary', 'variants')), 'CatalogProductVariant');
  assert.equal(
    arrayItemRef(schemaProperty('CatalogProduct', 'attributes')),
    'CatalogProductAttribute',
  );
  assert.equal(refName(schemaProperty('CheckoutQuote', 'address')), 'CustomerAddress');
  assert.deepEqual(
    (schemaProperty('CheckoutQuote', 'coupon').oneOf ?? []).map(refName).filter(Boolean),
    ['CheckoutCoupon'],
  );
  assert.equal(arrayItemRef(schemaProperty('CheckoutQuote', 'lines')), 'CheckoutQuoteLine');

  assert.equal(arrayItemRef(schemaProperty('CustomerOrderDetail', 'items')), 'CustomerOrderItem');
  assert.equal(
    refName((schemaProperty('CustomerOrderDetail', 'address').oneOf ?? [])[0]),
    'CustomerOrderAddress',
  );
  assert.equal(
    refName((schemaProperty('CustomerOrderDetail', 'payment').oneOf ?? [])[0]),
    'CustomerOrderPayment',
  );
  assert.equal(
    arrayItemRef(schemaProperty('CustomerOrderDetail', 'refunds')),
    'CustomerOrderRefund',
  );
  assert.equal(
    refName((schemaProperty('CustomerOrderDetail', 'returnRequest').oneOf ?? [])[0]),
    'CustomerReturnRequestResponse',
  );

  assert.equal(
    refName((schemaProperty('AdminOrderDetail', 'payment').oneOf ?? [])[0]),
    'AdminOrderPayment',
  );
  assert.equal(arrayItemRef(schemaProperty('AdminOrderDetail', 'refunds')), 'CustomerOrderRefund');
  assert.equal(
    refName((schemaProperty('AdminOrderDetail', 'customer').oneOf ?? [])[0]),
    'AdminOrderCustomer',
  );
  assert.equal(arrayItemRef(schemaProperty('AdminOrderDetail', 'items')), 'CustomerOrderItem');
  assert.equal(
    arrayItemRef(schemaProperty('AdminPaymentAttempt', 'refunds')),
    'AdminPaymentRefund',
  );
  assert.deepEqual(schemaProperty('AdminOrderPayment', 'status').enum, [
    'PENDING',
    'REDIRECTED',
    'SUCCEEDED',
    'FAILED',
    'EXPIRED',
    'CANCELLED',
  ]);
  assert.deepEqual(schemaProperty('AdminPaymentAttempt', 'paymentStatus').enum, [
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED',
  ]);

  assert.equal(
    arrayItemRef(schemaProperty('ApiEnvelopeCatalogSearchSuggestions', 'data')),
    'CatalogSearchSuggestion',
  );
  assert.equal(schemaProperty('CatalogSearchSuggestion', 'type').type, 'string');
  assert.deepEqual(schemaProperty('CatalogSearchSuggestion', 'type').enum, ['PRODUCT', 'CATEGORY']);
  const customerOrderItemSchema = contract.components.schemas.CustomerOrderItem;
  const adminPaymentAttemptSchema = contract.components.schemas.AdminPaymentAttempt;
  assert.ok(customerOrderItemSchema);
  assert.ok(adminPaymentAttemptSchema);
  assert.ok(customerOrderItemSchema.required?.includes('variantSnapshot'));
  assert.ok(adminPaymentAttemptSchema.required?.includes('refunds'));
});

test('client query and nested type exports remain aligned with OpenAPI', () => {
  const clientSchemas: Record<string, string> = {
    AdminContentBlock: 'AdminContentBlock',
    AdminContentPage: 'AdminContentPage',
    AdminCatalogProduct: 'AdminCatalogProduct',
    AdminCatalogProductDetail: 'AdminCatalogProductDetail',
    AdminCatalogProductListItem: 'AdminCatalogProductListItem',
    AdminCatalogProductVariant: 'AdminCatalogProductVariant',
    AdminCatalogProductMedia: 'AdminCatalogProductMedia',
    AdminCatalogCategory: 'AdminCatalogCategory',
    AdminCatalogProductOptionValue: 'AdminCatalogProductOptionValue',
    AdminCatalogProductOption: 'AdminCatalogProductOption',
    AdminInventoryItem: 'AdminInventoryItem',
    AdminInventoryMovement: 'AdminInventoryMovement',
    AdminCoupon: 'AdminCoupon',
    AdminCustomer: 'AdminCustomer',
    AdminNotificationJob: 'AdminNotificationJob',
    CustomerAddress: 'CustomerAddress',
    CustomerOrderItem: 'CustomerOrderItem',
    CustomerOrderAddress: 'CustomerOrderAddress',
    CustomerOrderPayment: 'CustomerOrderPayment',
    AdminOrderPayment: 'AdminOrderPayment',
    CustomerOrderRefund: 'CustomerOrderRefund',
    CustomerReturnRequest: 'CustomerReturnRequestResponse',
    CustomerOrderShipment: 'CustomerOrderShipment',
    CustomerOrderEvent: 'CustomerOrderEvent',
    CatalogProductColor: 'CatalogProductColor',
    CatalogProductOptionValue: 'CatalogProductOptionValue',
    CatalogProductOption: 'CatalogProductOption',
    CatalogProductAttribute: 'CatalogProductAttribute',
    CatalogSearchSuggestion: 'CatalogSearchSuggestion',
    CheckoutCoupon: 'CheckoutCoupon',
    CheckoutQuote: 'CheckoutQuote',
    CatalogProduct: 'CatalogProduct',
  };
  for (const [typeName, schemaName] of Object.entries(clientSchemas)) {
    assert.deepEqual(
      [...schemaFields(schemaName)].sort(),
      [...typeFields(typeName)].sort(),
      typeName,
    );
  }

  const clientQuerySchemas: Record<string, string> = {
    CatalogFacetQuery: 'CatalogFacetQuery',
    ProductListQuery: 'CatalogProductQuery',
    SearchSuggestionsQuery: 'CatalogSearchSuggestionsQuery',
    CustomerOrderListQuery: 'CustomerOrderListQuery',
    AdminOrderListQuery: 'AdminOrderListQuery',
    AdminPaymentListQuery: 'AdminPaymentListQuery',
    AdminContentPageListQuery: 'AdminContentPageListQuery',
    AdminContentListQuery: 'AdminSeoMetadataListQuery',
    SeoResolveQuery: 'SeoResolveQuery',
    AdminProductListQuery: 'AdminCatalogProductListQuery',
    AdminInventoryListQuery: 'AdminInventoryListQuery',
    AdminAuditListQuery: 'AdminAuditListQuery',
    AdminCouponListQuery: 'AdminCouponListQuery',
    AdminCustomerListQuery: 'AdminCustomerListQuery',
    AdminNotificationListQuery: 'AdminNotificationListQuery',
  };
  for (const [schemaName, typeName] of Object.entries(clientQuerySchemas)) {
    assert.deepEqual(
      [...schemaFields(schemaName)].sort(),
      [...typeFields(typeName)].sort(),
      typeName,
    );
  }
});
