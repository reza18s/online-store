export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  statusCode: number;
  requestId: string;
  timestamp: string;
  details?: unknown;
}

export interface ApiErrorEnvelope {
  error: ApiErrorPayload;
}

export interface SeoMetadata {
  path: string;
  title: string;
  description: string;
  canonicalUrl: string | null;
  noIndex: boolean;
  structuredData: unknown | null;
}

export type SeoRedirectStatusCode = 301 | 302 | 307 | 308;

export interface SeoRedirect {
  fromPath: string;
  toPath: string;
  statusCode: SeoRedirectStatusCode;
}

export interface SeoResolution {
  path: string;
  metadata: SeoMetadata | null;
  redirect: SeoRedirect | null;
}

export interface ContentBlock {
  kind: string;
  payload: unknown;
  sortOrder: number;
}

export interface ContentPage {
  slug: string;
  title: string;
  body: string | null;
  blocks: ContentBlock[];
}

export type AdminContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface AdminContentPageListItem {
  id: string;
  slug: string;
  title: string;
  status: AdminContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContentPage extends AdminContentPageListItem {
  body: string | null;
  blocks: Array<ContentBlock & { id: string }>;
}

export interface AdminContentPageListQuery {
  page?: number;
  limit?: number;
  q?: string;
  status?: AdminContentStatus;
}

export interface AdminContentPagePage {
  items: AdminContentPageListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminContentPageCreateInput {
  slug: string;
  title: string;
  body?: string | null;
  blocks?: Array<{ kind: string; payload: unknown; sortOrder?: number }>;
}

export interface AdminContentPageUpdateInput {
  title?: string;
  body?: string | null;
  blocks?: Array<{ kind: string; payload: unknown; sortOrder?: number }>;
  expectedUpdatedAt?: string;
}

export interface AdminContentPageStatusInput {
  status: AdminContentStatus;
  expectedUpdatedAt?: string;
}

export interface AdminSeoMetadata extends SeoMetadata {
  id: string;
  updatedAt: string;
}

export interface AdminSeoMetadataListQuery {
  page?: number;
  limit?: number;
  q?: string;
}

export interface AdminSeoMetadataPage {
  items: AdminSeoMetadata[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminSeoMetadataCreateInput {
  path: string;
  title: string;
  description: string;
  canonicalUrl?: string | null;
  noIndex?: boolean;
  structuredData?: unknown | null;
}

export interface AdminSeoMetadataUpdateInput {
  title?: string;
  description?: string;
  canonicalUrl?: string | null;
  noIndex?: boolean;
  structuredData?: unknown | null;
  expectedUpdatedAt?: string;
}

export interface AdminRedirect extends SeoRedirect {
  id: string;
  createdAt: string;
}

export interface AdminRedirectListQuery {
  page?: number;
  limit?: number;
  q?: string;
}

export interface AdminRedirectPage {
  items: AdminRedirect[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminRedirectCreateInput {
  fromPath: string;
  toPath: string;
  statusCode?: SeoRedirectStatusCode;
}

export interface AdminRedirectUpdateInput {
  toPath?: string;
  statusCode?: SeoRedirectStatusCode;
}

export interface HealthStatus {
  status: 'ok';
  service: 'api';
  timestamp: string;
  database?: 'ok';
}

export interface CustomerUser {
  id: string;
  phone: string;
  email: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}

export interface StaffUser {
  id: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  roles: string[];
}

export interface StaffLoginInput {
  email: string;
  password: string;
  factor: string;
}

export interface OtpRequestInput {
  phone: string;
}

export interface OtpVerifyInput {
  challengeId: string;
  code: string;
}

export type AdminCatalogProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface AdminCatalogProductListQuery {
  page?: number;
  limit?: number;
  q?: string;
  status?: AdminCatalogProductStatus;
  category?: string;
  lowStock?: boolean;
}

export type AdminInventoryVariantStatus = 'ALL' | 'ACTIVE' | 'INACTIVE';

export interface AdminInventoryListQuery {
  page?: number;
  limit?: number;
  q?: string;
  lowStock?: boolean;
  status?: AdminInventoryVariantStatus;
}

export type AdminInventoryStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type AdminInventoryMovementType =
  'RECEIPT' | 'ADJUSTMENT' | 'RESERVATION' | 'RELEASE' | 'SALE' | 'RETURN';

export interface AdminInventoryMovement {
  id: string;
  type: AdminInventoryMovementType;
  quantity: number;
  reference: string | null;
  createdAt: string;
}

export interface AdminInventoryItem {
  id: string;
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  productStatus: AdminCatalogProductStatus;
  sku: string;
  variantTitle: string | null;
  isActive: boolean;
  onHand: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  stockStatus: AdminInventoryStockStatus;
  updatedAt: string;
  recentMovements?: AdminInventoryMovement[];
}

export interface AdminInventoryPage {
  items: AdminInventoryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminInventoryAdjustmentInput {
  delta: number;
  reason: string;
  expectedUpdatedAt?: string;
}

export interface AdminInventoryReorderPointInput {
  reorderPoint: number;
  expectedUpdatedAt?: string;
}

export interface AdminCatalogProductStatusInput {
  status: AdminCatalogProductStatus;
}

export interface AdminCatalogProductCreateInput {
  slug: string;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  brand?: string | null;
  basePriceToman: number;
  compareAtPriceToman?: number | null;
}

export interface AdminCatalogProductUpdateInput {
  name?: string;
  shortDescription?: string | null;
  description?: string | null;
  brand?: string | null;
  basePriceToman?: number;
  compareAtPriceToman?: number | null;
}

export interface AdminCatalogProduct {
  id: string;
  slug: string;
  name: string;
  status: AdminCatalogProductStatus;
  publishedAt: string | null;
  archivedAt: string | null;
}

export type AdminCatalogProductStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface AdminCatalogProductCategorySummary {
  id: string;
  slug: string;
  name: string;
}

export interface AdminCatalogProductMediaPreview {
  url: string;
  altText: string;
}

export interface AdminCatalogProductInventorySummary {
  available: number;
  lowStockVariantCount: number;
  outOfStockVariantCount: number;
  status: AdminCatalogProductStockStatus;
}

export interface AdminCatalogProductDetail extends AdminCatalogProduct {
  shortDescription: string | null;
  description: string | null;
  brand: string | null;
  basePriceToman: number;
  compareAtPriceToman: number | null;
  createdAt: string;
  updatedAt: string;
}

export type AdminCatalogProductMediaKind = 'PRODUCT' | 'DETAIL' | 'SWATCH';

export interface AdminCatalogProductVariantInventory {
  onHand: number;
  reserved: number;
  reorderPoint: number;
}

export interface AdminCatalogProductVariant {
  id: string;
  productId: string;
  sku: string;
  title: string | null;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  priceToman: number | null;
  compareAtPriceToman: number | null;
  isActive: boolean;
  optionValueIds: string[];
  inventory: AdminCatalogProductVariantInventory | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCatalogProductMedia {
  id: string;
  productId: string;
  url: string;
  altText: string;
  kind: AdminCatalogProductMediaKind;
  sortOrder: number;
  width: number | null;
  height: number | null;
}

export interface AdminCatalogProductVariantCreateInput {
  sku: string;
  title?: string | null;
  size?: string | null;
  color?: string | null;
  colorHex?: string | null;
  priceToman?: number | null;
  compareAtPriceToman?: number | null;
  isActive?: boolean;
  optionValueIds?: string[];
}

export type AdminCatalogProductVariantUpdateInput = Omit<
  AdminCatalogProductVariantCreateInput,
  'sku'
>;

export interface AdminCatalogProductMediaCreateInput {
  url: string;
  altText: string;
  kind?: AdminCatalogProductMediaKind;
  sortOrder?: number;
  width?: number | null;
  height?: number | null;
}

export type AdminCatalogProductMediaUpdateInput = Partial<AdminCatalogProductMediaCreateInput>;

export interface AdminCatalogCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  archivedAt: string | null;
  productCount: number;
  childCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCatalogCategoryCreateInput {
  slug: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
}

export interface AdminCatalogCategoryUpdateInput {
  name?: string;
  description?: string | null;
  parentId?: string | null;
}

export interface AdminCatalogCategoryStatusInput {
  archived: boolean;
}

export interface AdminCatalogProductCategoryInput {
  categoryIds: string[];
}

export interface AdminCatalogProductOptionValue {
  id: string;
  optionId: string;
  key: string;
  label: string;
  sortOrder: number;
  variantCount: number;
}

export interface AdminCatalogProductOption {
  id: string;
  productId: string;
  key: string;
  name: string;
  sortOrder: number;
  values: AdminCatalogProductOptionValue[];
}

export interface AdminCatalogProductOptionCreateInput {
  key: string;
  name: string;
  sortOrder?: number;
}

export interface AdminCatalogProductOptionUpdateInput {
  name?: string;
  sortOrder?: number;
}

export interface AdminCatalogProductOptionValueCreateInput {
  key: string;
  label: string;
  sortOrder?: number;
}

export interface AdminCatalogProductOptionValueUpdateInput {
  label?: string;
  sortOrder?: number;
}

export interface AdminCatalogProductListItem extends AdminCatalogProduct {
  basePriceToman: number;
  compareAtPriceToman: number | null;
  categories: AdminCatalogProductCategorySummary[];
  primaryMedia: AdminCatalogProductMediaPreview | null;
  inventory: AdminCatalogProductInventorySummary;
  variantCount: number;
  mediaCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCatalogProductPage {
  items: AdminCatalogProductListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface OtpRequestResponse {
  challengeId: string;
  expiresAt: string;
  resendAvailableAt: string;
}

export interface OtpVerifyResponse {
  user: CustomerUser;
  expiresAt: string;
}

export interface CustomerAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddressCreateInput {
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  isDefault?: boolean;
}

export type CustomerAddressUpdateInput = Partial<CustomerAddressCreateInput>;

export type CheckoutShippingMethod = 'STANDARD' | 'EXPRESS';

export interface CheckoutRequestInput {
  addressId: string;
  shippingMethod: CheckoutShippingMethod;
  couponCode?: string;
}

export interface CheckoutSelectedOption {
  key: string;
  name: string;
  valueKey: string;
  valueLabel: string;
}

export interface CheckoutQuoteLine {
  cartItemId: string;
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  selectedOptions: CheckoutSelectedOption[];
  quantity: number;
  unitPriceToman: number;
  compareAtPriceToman: number | null;
  lineTotalToman: number;
}

export interface CheckoutCoupon {
  couponId: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  amount: number;
  minimumOrderToman: number;
  discountToman: number;
}

export interface CheckoutQuote {
  cartId: string;
  address: CustomerAddress;
  shippingMethod: CheckoutShippingMethod;
  shippingLabel: string;
  shippingEstimate: string;
  lines: CheckoutQuoteLine[];
  subtotalToman: number;
  discountToman: number;
  coupon: CheckoutCoupon | null;
  shippingToman: number;
  taxToman: number;
  totalToman: number;
  currency: 'TOMAN';
  expiresAt: string;
}

export type CheckoutPaymentAttemptStatus =
  'PENDING' | 'REDIRECTED' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export type CheckoutOrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type CheckoutPaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface CheckoutPayment {
  status: CheckoutPaymentAttemptStatus;
  redirectUrl: string | null;
}

export interface CheckoutOrder {
  orderId: string;
  orderNumber: string;
  status: CheckoutOrderStatus;
  paymentStatus: CheckoutPaymentStatus;
  subtotalToman: number;
  discountToman: number;
  shippingToman: number;
  taxToman: number;
  totalToman: number;
  currency: 'TOMAN';
  payment: CheckoutPayment;
}

export type PaymentCallbackOutcome = 'PAID' | 'FAILED' | 'DUPLICATE' | 'REFUNDED' | 'REFUND_FAILED';

export interface PaymentCallbackResponse {
  provider: string;
  providerEventId: string;
  orderNumber: string;
  outcome: PaymentCallbackOutcome;
  paymentStatus: CheckoutPaymentStatus | null;
  refundStatus: 'PENDING' | 'SUCCEEDED' | 'FAILED' | null;
}

export interface CustomerOrderListQuery {
  page?: number;
  limit?: number;
  status?: CheckoutOrderStatus;
}

export interface CustomerOrderSummary {
  orderId: string;
  orderNumber: string;
  status: CheckoutOrderStatus;
  paymentStatus: CheckoutPaymentStatus;
  subtotalToman: number;
  discountToman: number;
  shippingToman: number;
  taxToman: number;
  totalToman: number;
  currency: 'TOMAN';
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  sku: string;
  variantSnapshot: unknown;
  quantity: number;
  unitPriceToman: number;
  compareAtPriceToman: number | null;
  discountToman: number;
  taxToman: number;
  totalToman: number;
}

export interface CustomerOrderAddress {
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
}

export interface CustomerOrderPayment {
  status: CheckoutPaymentAttemptStatus;
  amountToman: number;
  redirectUrl: string | null;
  createdAt: string;
  paidAt: string | null;
}

export type OrderRefundStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED';

export interface CustomerOrderRefund {
  id: string;
  amountToman: number;
  status: OrderRefundStatus;
  reason: string | null;
  createdAt: string;
  completedAt: string | null;
}

export type CustomerReturnReason =
  | 'DAMAGED'
  | 'INCORRECT_ITEM'
  | 'DEFECTIVE'
  | 'SIZE_PREFERENCE'
  | 'COLOR_PREFERENCE'
  | 'CHANGE_OF_MIND';

export type CustomerReturnRequestStatus =
  'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED' | 'CANCELLED';

export interface CustomerReturnItem {
  orderItemId: string;
  quantity: number;
}

export interface CustomerReturnRequest {
  id: string;
  reason: CustomerReturnReason;
  note: string | null;
  status: CustomerReturnRequestStatus;
  requestedAt: string;
  reviewedAt: string | null;
  receivedAt: string | null;
  items: CustomerReturnItem[];
}

export type CustomerOrderShipmentStatus =
  'PENDING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';

export interface CustomerOrderShipment {
  provider: string;
  method: string;
  trackingReference: string | null;
  status: CustomerOrderShipmentStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
}

export interface CustomerOrderEvent {
  fromStatus: CheckoutOrderStatus | null;
  toStatus: CheckoutOrderStatus | null;
  createdAt: string;
}

export interface CustomerOrderDetail extends CustomerOrderSummary {
  items: CustomerOrderItem[];
  address: CustomerOrderAddress | null;
  payment: CustomerOrderPayment | null;
  shipment: CustomerOrderShipment | null;
  events: CustomerOrderEvent[];
  refunds: CustomerOrderRefund[];
  returnRequest: CustomerReturnRequest | null;
}

export interface CustomerOrderPage {
  items: CustomerOrderSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminOrderListQuery {
  page?: number;
  limit?: number;
  q?: string;
  status?: CheckoutOrderStatus;
  paymentStatus?: CheckoutPaymentStatus;
}

export interface AdminOrderCustomer {
  id: string;
  phone: string;
  email: string | null;
  status: CustomerUser['status'];
}

export interface AdminOrderSummary extends CustomerOrderSummary {
  customer: AdminOrderCustomer | null;
  shipmentStatus: CustomerOrderShipmentStatus | null;
  trackingReference: string | null;
}

export interface AdminOrderPage {
  items: AdminOrderSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminOrderDetail extends CustomerOrderDetail {
  customer: AdminOrderCustomer | null;
}

export type AdminAuditActorType = 'CUSTOMER' | 'STAFF' | 'SYSTEM';

export interface AdminAuditListQuery {
  page?: number;
  limit?: number;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  actorUserId?: string;
  actorType?: AdminAuditActorType;
}

export interface AdminAuditEvent {
  id: string;
  actorType: AdminAuditActorType;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface AdminAuditPage {
  items: AdminAuditEvent[];
  total: number;
  page: number;
  limit: number;
}

export type AdminPaymentAttemptStatus = CheckoutPaymentAttemptStatus;

export interface AdminPaymentListQuery {
  page?: number;
  limit?: number;
  status?: AdminPaymentAttemptStatus;
  provider?: string;
  orderNumber?: string;
}

export interface AdminPaymentRefund {
  id: string;
  amountToman: number;
  status: OrderRefundStatus;
  providerRefundId: string | null;
  reason: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface AdminPaymentAttempt {
  id: string;
  orderId: string;
  orderNumber: string;
  provider: string;
  providerTransactionId: string | null;
  status: AdminPaymentAttemptStatus;
  amountToman: number;
  orderStatus: CheckoutOrderStatus;
  paymentStatus: CheckoutPaymentStatus;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  refunds: AdminPaymentRefund[];
}

export interface AdminPaymentPage {
  items: AdminPaymentAttempt[];
  total: number;
  page: number;
  limit: number;
}

export type AdminCouponType = 'PERCENTAGE' | 'FIXED';
export type AdminCouponStatus = 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'DISABLED';
export type AdminCouponStatusFilter = 'ALL' | AdminCouponStatus;

export interface AdminCoupon {
  id: string;
  code: string;
  type: AdminCouponType;
  amount: number;
  minimumOrderToman: number;
  activeFrom: string;
  activeUntil: string;
  maxRedemptions: number | null;
  perUserLimit: number | null;
  status: AdminCouponStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCouponPage {
  items: AdminCoupon[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminCouponListQuery {
  page?: number;
  limit?: number;
  q?: string;
  status?: AdminCouponStatusFilter;
}

export interface AdminCouponCreateInput {
  code: string;
  type: AdminCouponType;
  amount: number;
  minimumOrderToman: number;
  activeFrom: string;
  activeUntil: string;
  maxRedemptions?: number | null;
  perUserLimit?: number | null;
  isActive?: boolean;
}

export interface AdminCouponUpdateInput {
  activeFrom?: string;
  activeUntil?: string;
  maxRedemptions?: number | null;
  perUserLimit?: number | null;
  isActive?: boolean;
  expectedUpdatedAt?: string;
}

export type AdminCustomerStatus = CustomerUser['status'];

export interface AdminCustomerListQuery {
  page?: number;
  limit?: number;
  q?: string;
  status?: AdminCustomerStatus;
}

export interface AdminCustomer {
  id: string;
  phone: string;
  email: string | null;
  status: AdminCustomerStatus;
  orderCount: number;
  lastOrderNumber: string | null;
  lastOrderStatus: CheckoutOrderStatus | null;
  lastOrderAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCustomerPage {
  items: AdminCustomer[];
  total: number;
  page: number;
  limit: number;
}

export type AdminNotificationStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';

export interface AdminNotificationListQuery {
  page?: number;
  limit?: number;
  kind?: string;
  status?: AdminNotificationStatus;
}

export interface AdminNotificationJob {
  id: string;
  kind: string;
  status: AdminNotificationStatus;
  attempts: number;
  availableAt: string;
  processedAt: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface AdminNotificationPage {
  items: AdminNotificationJob[];
  total: number;
  page: number;
  limit: number;
}

export type AdminFulfillmentOrderStatus = 'PREPARING' | 'SHIPPED' | 'DELIVERED';

export type AdminShipmentStatus = 'PENDING' | 'PACKED' | 'SHIPPED' | 'DELIVERED';

export interface AdminOrderStatusInput {
  status: AdminFulfillmentOrderStatus;
  reason: string;
  expectedUpdatedAt?: string;
}

export interface AdminShipmentUpdateInput {
  provider: string;
  method: string;
  status: AdminShipmentStatus;
  trackingReference?: string | null;
  reason: string;
  expectedUpdatedAt?: string;
}

export interface CustomerOrderCancelInput {
  reason: string;
}

export interface CustomerReturnItemInput {
  orderItemId: string;
  quantity: number;
}

export interface CustomerReturnRequestInput {
  reason: CustomerReturnReason;
  note?: string | null;
  unusedConfirmed: boolean;
  unwashedConfirmed: boolean;
  tagsAttachedConfirmed: boolean;
  items: CustomerReturnItemInput[];
}

export type AdminReturnReviewStatus = 'APPROVED' | 'REJECTED' | 'RECEIVED';

export interface AdminReturnReviewInput {
  status: AdminReturnReviewStatus;
  reason: string;
  expectedUpdatedAt?: string;
}

export interface CatalogCategory {
  id: string;
  slug: string;
  name: string;
}

export type CatalogSearchSuggestionType = 'PRODUCT' | 'CATEGORY';

export interface CatalogSearchSuggestion {
  type: CatalogSearchSuggestionType;
  id: string;
  slug: string;
  label: string;
  imageUrl: string | null;
  imageAlt: string | null;
}

export type CatalogAudience = 'women' | 'men' | 'children';

export type CatalogSort = 'newest' | 'price_asc' | 'price_desc' | 'name';

export type CatalogStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface CatalogProductColor {
  name: string;
  hex: string | null;
}

export interface CatalogProductOptionValue {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
}

export interface CatalogProductOption {
  id: string;
  key: string;
  name: string;
  sortOrder: number;
  values: CatalogProductOptionValue[];
}

export interface CatalogProductQuery {
  q?: string;
  category?: string;
  audience?: CatalogAudience;
  size?: string;
  color?: string;
  material?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  sort?: CatalogSort;
  page?: number;
  limit?: number;
}

export interface CatalogFacetQuery {
  q?: string;
  category?: string;
  audience?: CatalogAudience;
  size?: string;
  color?: string;
  material?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
}

export type CatalogFacetKey = 'size' | 'color' | 'material';

export interface CatalogFacetOption {
  value: string;
  label: string;
  count: number;
  selected: boolean;
  hex?: string | null;
}

export interface CatalogFacetGroup {
  key: CatalogFacetKey;
  label: string;
  options: CatalogFacetOption[];
}

export interface CatalogFacets {
  groups: CatalogFacetGroup[];
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  priceToman: number;
  compareAtPriceToman: number | null;
  available: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
  categories: CatalogCategory[];
  options: CatalogProductOption[];
  variants: CatalogProductVariant[];
  colors: CatalogProductColor[];
  stockStatus: CatalogStockStatus;
}

export interface CatalogProductPage {
  items: ProductSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface CatalogProductVariant {
  id: string;
  sku: string;
  title: string | null;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  priceToman: number | null;
  compareAtPriceToman: number | null;
  optionValueIds: string[];
  media: CatalogVariantMedia[];
  available: boolean;
}

export interface CatalogVariantMedia {
  url: string;
  altText: string;
  sortOrder: number;
}

export interface CatalogProductMedia {
  url: string;
  altText: string;
  kind: 'PRODUCT' | 'DETAIL' | 'SWATCH';
  sortOrder: number;
}

export interface CatalogProductAttribute {
  key: string;
  value: string;
}

export interface CatalogProduct extends ProductSummary {
  shortDescription: string | null;
  description: string | null;
  brand: string | null;
  media: CatalogProductMedia[];
  attributes: CatalogProductAttribute[];
}

export type CatalogSearchPage = CatalogProductPage;

export type CartKind = 'GUEST' | 'CUSTOMER';

export interface CartLine {
  id: string;
  variantId: string;
  quantity: number;
  available: boolean;
  productId: string;
  productSlug: string;
  productName: string;
  sku: string;
  title: string | null;
  unitPriceToman: number;
  compareAtPriceToman: number | null;
  imageUrl: string | null;
  imageAlt: string | null;
}

export interface CartView {
  id: string | null;
  kind: CartKind;
  items: CartLine[];
  itemCount: number;
  subtotalToman: number;
  currency: 'TOMAN';
}

export type CartMergeConflictReason = 'VARIANT_UNAVAILABLE' | 'STOCK_LIMIT' | 'QUANTITY_LIMIT';

export interface CartMergeConflict {
  variantId: string;
  reason: CartMergeConflictReason;
  guestQuantity: number;
  customerQuantity: number;
  mergedQuantity: number;
  availableQuantity: number | null;
}

export interface CartMergeConflictDetails {
  conflicts: CartMergeConflict[];
}

export interface CartItemMutation {
  variantId: string;
  quantity: number;
}
