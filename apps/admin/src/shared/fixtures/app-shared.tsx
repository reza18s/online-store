import type { AdminCatalogProductStatus } from '@nova/api-client';

export type Product = {
  slug: string;
  name: string;
  image: string;
};

export const products: Product[] = [
  {
    slug: 'linen-overshirt',
    name: 'مانتوی لینن کمربندی آوا',
    image: '/assets/nova-product-linen-overshirt.webp',
  },
  {
    slug: 'oxford-shirt',
    name: 'پیراهن آکسفورد مردانه',
    image: '/assets/nova-product-oxford-shirt.webp',
  },
  {
    slug: 'kids-knit-set',
    name: 'ست دورس و شلوار کودک',
    image: '/assets/nova-product-kids-set.webp',
  },
  {
    slug: 'textured-scarf',
    name: 'شال بافت برجسته',
    image: '/assets/nova-product-textured-scarf.webp',
  },
  {
    slug: 'soft-trousers',
    name: 'شلوار نرم و راسته',
    image: '/assets/nova-product-soft-trousers.webp',
  },
  {
    slug: 'knit-cardigan',
    name: 'ژاکت بافت یقه‌گرد',
    image: '/assets/nova-product-knit-cardigan.webp',
  },
];

export const ADMIN_PREVIEW_NOTICE = 'پیش‌نمایش توسعه · همه رکوردها و اعداد ساختگی هستند.';

export type AdminStatusTone = 'success' | 'info' | 'warning' | 'neutral';

export const adminStatusVariants: Record<
  AdminStatusTone,
  'success' | 'info' | 'warning' | 'secondary'
> = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  neutral: 'secondary',
};

export const adminLatestOrders = [
  {
    id: '#DEMO-001',
    customer: 'مشتری نمونه ۱',
    amount: 'نمونه ۱٬۲۴۰٬۰۰۰ تومان',
    status: 'در حال پردازش',
    tone: 'info' as AdminStatusTone,
    time: 'زمان نمونه ۱',
  },
  {
    id: '#DEMO-002',
    customer: 'مشتری نمونه ۲',
    amount: 'نمونه ۳٬۸۵۰٬۰۰۰ تومان',
    status: 'ارسال شده',
    tone: 'success' as AdminStatusTone,
    time: 'زمان نمونه ۲',
  },
  {
    id: '#DEMO-003',
    customer: 'مشتری نمونه ۳',
    amount: 'نمونه ۹۸۰٬۰۰۰ تومان',
    status: 'در انتظار پرداخت',
    tone: 'warning' as AdminStatusTone,
    time: 'زمان نمونه ۳',
  },
  {
    id: '#DEMO-004',
    customer: 'مشتری نمونه ۴',
    amount: 'نمونه ۴٬۲۹۰٬۰۰۰ تومان',
    status: 'تکمیل شد',
    tone: 'success' as AdminStatusTone,
    time: 'زمان نمونه ۴',
  },
  {
    id: '#DEMO-005',
    customer: 'مشتری نمونه ۵',
    amount: 'نمونه ۲٬۱۱۰٬۰۰۰ تومان',
    status: 'ارسال شده',
    tone: 'success' as AdminStatusTone,
    time: 'زمان نمونه ۵',
  },
];

export type StaffLoginField = 'email' | 'password' | 'factor';

export type StaffLoginValidation = {
  field: StaffLoginField;
  message: string;
};

export type AdminProductStatusFilter = 'all' | AdminCatalogProductStatus;

export type AdminProductStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  image: string | null;
  alt: string;
  lifecycleStatus: AdminCatalogProductStatus;
  stockStatus: AdminProductStockStatus;
};

export type AdminLowStockItem = {
  productId: string;
  slug: string;
  name: string;
  stock: number;
  image: string | null;
  alt: string;
};

export type AdminOrderPreview = {
  id: string;
  orderNumber: string;
  customer: string;
  amount: number;
  status: string;
  statusTone: 'warning' | 'success' | 'danger';
  date: string;
};

export const adminProductRows: AdminProductRow[] = [
  {
    id: 'preview-linen-overshirt',
    slug: 'linen-overshirt',
    name: 'محصول نمونه ۱',
    category: 'دسته نمونه ۱',
    categorySlug: 'outerwear',
    price: 0,
    compareAtPrice: null,
    stock: 0,
    image: '/assets/nova-product-linen-overshirt.webp',
    alt: 'تصویر محصول نمونه ۱',
    lifecycleStatus: 'PUBLISHED',
    stockStatus: 'IN_STOCK',
  },
  {
    id: 'preview-knit-cardigan',
    slug: 'knit-cardigan',
    name: 'محصول نمونه ۲',
    category: 'دسته نمونه ۲',
    categorySlug: 'knitwear',
    price: 0,
    compareAtPrice: null,
    stock: 0,
    image: '/assets/nova-product-knit-cardigan.webp',
    alt: 'تصویر محصول نمونه ۲',
    lifecycleStatus: 'PUBLISHED',
    stockStatus: 'LOW_STOCK',
  },
  {
    id: 'preview-oxford-shirt',
    slug: 'oxford-shirt',
    name: 'محصول نمونه ۳',
    category: 'دسته نمونه ۳',
    categorySlug: 'shirts',
    price: 0,
    compareAtPrice: null,
    stock: 0,
    image: '/assets/nova-product-oxford-shirt.webp',
    alt: 'تصویر محصول نمونه ۳',
    lifecycleStatus: 'PUBLISHED',
    stockStatus: 'IN_STOCK',
  },
  {
    id: 'preview-textured-scarf',
    slug: 'textured-scarf',
    name: 'محصول نمونه ۴',
    category: 'دسته نمونه ۴',
    categorySlug: 'accessories',
    price: 0,
    compareAtPrice: null,
    stock: 0,
    image: '/assets/nova-product-textured-scarf.webp',
    alt: 'تصویر محصول نمونه ۴',
    lifecycleStatus: 'PUBLISHED',
    stockStatus: 'LOW_STOCK',
  },
  {
    id: 'preview-soft-trousers',
    slug: 'soft-trousers',
    name: 'محصول نمونه ۵',
    category: 'دسته نمونه ۵',
    categorySlug: 'trousers',
    price: 0,
    compareAtPrice: null,
    stock: 0,
    image: '/assets/nova-product-soft-trousers.webp',
    alt: 'تصویر محصول نمونه ۵',
    lifecycleStatus: 'PUBLISHED',
    stockStatus: 'IN_STOCK',
  },
];

export const adminLowStockItems: AdminLowStockItem[] = [
  {
    productId: 'preview-knit-cardigan',
    slug: 'knit-cardigan',
    name: 'محصول نمونه ۲',
    stock: 0,
    image: '/assets/nova-product-knit-cardigan.webp',
    alt: 'تصویر محصول نمونه ۲',
  },
  {
    productId: 'preview-textured-scarf',
    slug: 'textured-scarf',
    name: 'محصول نمونه ۴',
    stock: 0,
    image: '/assets/nova-product-textured-scarf.webp',
    alt: 'تصویر محصول نمونه ۴',
  },
  {
    productId: 'preview-soft-trousers',
    slug: 'soft-trousers',
    name: 'محصول نمونه ۵',
    stock: 0,
    image: '/assets/nova-product-soft-trousers.webp',
    alt: 'تصویر محصول نمونه ۵',
  },
];

export const adminOrderPreviews: AdminOrderPreview[] = [
  {
    id: '#DEMO-001',
    orderNumber: 'NV-DEMO-001',
    customer: 'مشتری نمونه ۱',
    amount: 0,
    status: 'وضعیت نمونه',
    statusTone: 'warning',
    date: 'تاریخ نمونه',
  },
  {
    id: '#DEMO-002',
    orderNumber: 'NV-DEMO-002',
    customer: 'مشتری نمونه ۲',
    amount: 0,
    status: 'وضعیت نمونه',
    statusTone: 'success',
    date: 'تاریخ نمونه',
  },
  {
    id: '#DEMO-003',
    orderNumber: 'NV-DEMO-003',
    customer: 'مشتری نمونه ۳',
    amount: 0,
    status: 'وضعیت نمونه',
    statusTone: 'warning',
    date: 'تاریخ نمونه',
  },
  {
    id: '#DEMO-004',
    orderNumber: 'NV-DEMO-004',
    customer: 'مشتری نمونه ۴',
    amount: 0,
    status: 'وضعیت نمونه',
    statusTone: 'success',
    date: 'تاریخ نمونه',
  },
  {
    id: '#DEMO-005',
    orderNumber: 'NV-DEMO-005',
    customer: 'مشتری نمونه ۵',
    amount: 0,
    status: 'وضعیت نمونه',
    statusTone: 'warning',
    date: 'تاریخ نمونه',
  },
];
