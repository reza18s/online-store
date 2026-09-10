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
    schemas: Record<string, Schema>;
    responses: Record<string, Record<string, unknown>>;
  };
};

type Schema = {
  properties?: Record<string, unknown>;
  required?: string[];
  allOf?: Array<{ $ref?: string; properties?: Record<string, unknown> }>;
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
