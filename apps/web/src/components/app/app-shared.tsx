import type { CartView } from '@nova/api-client';

import { type IconName } from '../ui/icon';
import { type PreviewState } from '../../hooks/routing/hash-route';

import type { StorefrontProduct } from '../../lib/catalog/catalog-api';

export type Product = StorefrontProduct;

export const products: Product[] = [
  {
    slug: 'linen-overshirt',
    name: 'مانتوی لینن کمربندی آوا',
    audience: 'women',
    category: 'مانتو و رویه',
    price: 2490000,
    compareAt: 2890000,
    image: '/assets/nova-product-linen-overshirt.webp',
    alt: 'مانتوی لینن روشن با کمربند پارچه‌ای',
    colors: ['#e6ddd0', '#a89b8d', '#272220'],
    tag: 'تازه‌وارد',
    stock: 'موجود',
  },
  {
    slug: 'oxford-shirt',
    name: 'پیراهن آکسفورد مردانه',
    audience: 'men',
    category: 'پیراهن مردانه',
    price: 1890000,
    image: '/assets/nova-product-oxford-shirt.webp',
    alt: 'پیراهن آکسفورد آبی روشن',
    colors: ['#b7c7dc', '#263d68'],
    tag: 'پرفروش',
    stock: 'موجود',
  },
  {
    slug: 'kids-knit-set',
    name: 'ست دورس و شلوار کودک',
    audience: 'children',
    category: 'لباس کودک',
    price: 1690000,
    image: '/assets/nova-product-kids-set.webp',
    alt: 'ست دورس سبز زیتونی کودک',
    colors: ['#65705b', '#263026'],
    tag: 'سایزهای کامل',
    stock: 'موجود',
  },
  {
    slug: 'textured-scarf',
    name: 'شال بافت برجسته',
    audience: 'women',
    category: 'اکسسوری',
    price: 890000,
    image: '/assets/nova-product-textured-scarf.webp',
    alt: 'شال بافتنی با رنگ خنثی',
    colors: ['#e7ded2', '#9b8b78'],
    tag: 'اکسسوری',
    stock: 'موجود',
  },
  {
    slug: 'soft-trousers',
    name: 'شلوار نرم و راسته',
    audience: 'women',
    category: 'شلوار',
    price: 1990000,
    image: '/assets/nova-product-soft-trousers.webp',
    alt: 'شلوار پارچه‌ای نرم به رنگ خاکی',
    colors: ['#b1a394', '#292621'],
    stock: 'رو به اتمام',
  },
  {
    slug: 'knit-cardigan',
    name: 'ژاکت بافت یقه‌گرد',
    audience: 'women',
    category: 'بافت',
    price: 2190000,
    image: '/assets/nova-product-knit-cardigan.webp',
    alt: 'ژاکت بافتنی قهوه‌ای روشن',
    colors: ['#817464', '#44382d', '#d7cbbb'],
    tag: 'فصل تازه',
    stock: 'موجود',
  },
];

export const authPhoneStorageKey = 'nova.auth.phone';

export const previewStateCopy: Record<
  PreviewState,
  {
    eyebrow: string;
    title: string;
    description: string;
    icon: IconName;
    primary: string;
    primaryHref: string;
    secondary?: string;
    secondaryHref?: string;
  }
> = {
  'cart-conflict': {
    eyebrow: 'CART / STOCK CONFLICT',
    title: 'یک کالا در سبد شما تغییر کرده است',
    description:
      'موجودی یا قیمت یکی از کالاها تغییر کرده است. سبد را دوباره بررسی کنید تا مبلغ نهایی دقیق نمایش داده شود.',
    icon: 'warning',
    primary: 'بررسی سبد خرید',
    primaryHref: '#cart',
    secondary: 'ادامه خرید',
    secondaryHref: '#products',
  },
  'payment-pending': {
    eyebrow: 'PAYMENT / PENDING',
    title: 'در حال بررسی پرداخت',
    description:
      'پرداخت شما هنوز توسط درگاه تأیید نشده است. این صفحه را نبندید؛ وضعیت سفارش به‌صورت امن بررسی می‌شود.',
    icon: 'refresh',
    primary: 'پیگیری سفارش',
    primaryHref: '#account/orders',
    secondary: 'بازگشت به خانه',
    secondaryHref: '#home',
  },
  'payment-failed': {
    eyebrow: 'PAYMENT / FAILED',
    title: 'پرداخت انجام نشد',
    description:
      'پرداخت تأیید نشد اما سبد شما حفظ شده است. می‌توانید دوباره تلاش کنید یا روش پرداخت دیگری انتخاب کنید.',
    icon: 'close',
    primary: 'تلاش دوباره',
    primaryHref: '#checkout/payment',
    secondary: 'بازگشت به سبد',
    secondaryHref: '#cart',
  },
  'payment-recovery': {
    eyebrow: 'PAYMENT / RECOVERY',
    title: 'ادامه پرداخت سفارش',
    description:
      'برای تکمیل سفارش، پرداخت را از همان سبد و مبلغ معتبر ادامه دهید. وضعیت نهایی فقط توسط سرور تأیید می‌شود.',
    icon: 'refresh',
    primary: 'ادامه پرداخت',
    primaryHref: '#checkout/payment',
    secondary: 'مشاهده سفارش',
    secondaryHref: '#account/orders',
  },
  offline: {
    eyebrow: 'NOVA / OFFLINE',
    title: 'ارتباط با نوا برقرار نیست',
    description:
      'اتصال اینترنت را بررسی کنید و دوباره تلاش کنید. اطلاعات فرم سفارش تا جای ممکن در همین صفحه حفظ می‌شود.',
    icon: 'refresh',
    primary: 'تلاش دوباره',
    primaryHref: '#home',
    secondary: 'راهنمای پشتیبانی',
    secondaryHref: '#support',
  },
  error: {
    eyebrow: 'NOVA / ERROR',
    title: 'مشکلی پیش آمد',
    description:
      'این پیش‌نمایش نتوانست صفحه را کامل آماده کند. اگر مشکل ادامه داشت، با پشتیبانی نوا در تماس باشید.',
    icon: 'warning',
    primary: 'بازگشت به خانه',
    primaryHref: '#home',
    secondary: 'تماس با پشتیبانی',
    secondaryHref: '#support',
  },
  maintenance: {
    eyebrow: 'NOVA / MAINTENANCE',
    title: 'نوا برای لحظاتی در حال به‌روزرسانی است',
    description: 'فروشگاه به‌زودی دوباره در دسترس خواهد بود. از شکیبایی شما ممنونیم.',
    icon: 'settings',
    primary: 'تلاش دوباره',
    primaryHref: '#home',
  },
};

export type RouteViewProps = {
  route: string;
  cart: CartView | undefined;
  cartLoading: boolean;
  cartError: boolean;
  onRetryCart: () => void;
  customerId?: string;
  isWishlisted: (slug: string) => boolean;
  onToggleWishlist: (slug: string) => void;
};
