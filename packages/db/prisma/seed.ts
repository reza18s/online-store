import 'dotenv/config';

import { createCipheriv, createHash, createHmac, randomBytes, scryptSync } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

const localDatabaseUrl = 'postgresql://nova:nova_local_only@localhost:5432/nova?schema=public';
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? localDatabaseUrl,
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_LOCAL_STAFF_EMAIL = 'admin@nova.local';
const DEFAULT_LOCAL_STAFF_PHONE = '+989120000000';
const DEFAULT_LOCAL_STAFF_PASSWORD = 'nova-local-admin-password-2026';
const DEFAULT_LOCAL_STAFF_TOTP_SECRET = 'JBSWY3DPEHPK3PXP';
const DEFAULT_LOCAL_STAFF_RECOVERY_CODE = 'NOVAADMIN1';
const DEFAULT_AUTH_SECRET = 'nova-local-only-auth-secret-change-me-2026';
const DEFAULT_STAFF_TOTP_ENCRYPTION_KEY = 'nova-local-only-staff-totp-key-change-me-2026';
const PASSWORD_HASH_VERSION = 'scrypt-v1';
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SCRYPT_N = 32_768;
const PASSWORD_SCRYPT_R = 8;
const PASSWORD_SCRYPT_P = 1;
const PASSWORD_SCRYPT_MAXMEM = 64 * 1024 * 1024;

interface LocalStaffFixture {
  email: string;
  phone: string;
  password: string;
  totpSecret: string;
  recoveryCode: string;
}

function toBase64Url(value: Uint8Array): string {
  return Buffer.from(value).toString('base64url');
}

function localTestModeEnabled(): boolean {
  const rawValue = process.env.LOCAL_TEST_MODE?.trim().toLowerCase();
  if (!rawValue || rawValue === 'false') return false;
  if (rawValue !== 'true') {
    throw new Error('LOCAL_TEST_MODE must be true or false.');
  }

  const nodeEnvironment = process.env.NODE_ENV?.trim().toLowerCase() || 'development';
  if (nodeEnvironment !== 'development' && nodeEnvironment !== 'test') {
    throw new Error('LOCAL_TEST_MODE is allowed only in development or test environments.');
  }
  return true;
}

function localStaffFixture(): LocalStaffFixture {
  const fixture: LocalStaffFixture = {
    email: (process.env.LOCAL_STAFF_EMAIL?.trim() || DEFAULT_LOCAL_STAFF_EMAIL).toLowerCase(),
    phone: process.env.LOCAL_STAFF_PHONE?.trim() || DEFAULT_LOCAL_STAFF_PHONE,
    password: process.env.LOCAL_STAFF_PASSWORD || DEFAULT_LOCAL_STAFF_PASSWORD,
    totpSecret: (process.env.LOCAL_STAFF_TOTP_SECRET?.trim() || DEFAULT_LOCAL_STAFF_TOTP_SECRET)
      .replace(/\s/g, '')
      .toUpperCase(),
    recoveryCode: (
      process.env.LOCAL_STAFF_RECOVERY_CODE?.trim() || DEFAULT_LOCAL_STAFF_RECOVERY_CODE
    )
      .replace(/[\s-]/g, '')
      .toUpperCase(),
  };

  if (!/^[^\s@]+@[^\s@]+$/.test(fixture.email)) {
    throw new Error('LOCAL_STAFF_EMAIL must be a valid email address.');
  }
  if (!/^\+989\d{9}$/.test(fixture.phone)) {
    throw new Error('LOCAL_STAFF_PHONE must be an Iranian mobile number in international format.');
  }
  if (fixture.password.length < 12 || fixture.password.length > 200) {
    throw new Error('LOCAL_STAFF_PASSWORD must contain 12 to 200 characters.');
  }
  if (!/^[A-Z2-7]+=*$/.test(fixture.totpSecret) || fixture.totpSecret.length < 16) {
    throw new Error('LOCAL_STAFF_TOTP_SECRET must be a base32 TOTP secret.');
  }
  if (!/^[A-Z0-9]{10}$/.test(fixture.recoveryCode)) {
    throw new Error('LOCAL_STAFF_RECOVERY_CODE must contain exactly 10 letters or digits.');
  }

  return fixture;
}

function hashLocalStaffPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH, {
    N: PASSWORD_SCRYPT_N,
    r: PASSWORD_SCRYPT_R,
    p: PASSWORD_SCRYPT_P,
    maxmem: PASSWORD_SCRYPT_MAXMEM,
  });
  return [
    PASSWORD_HASH_VERSION,
    PASSWORD_SCRYPT_N,
    PASSWORD_SCRYPT_R,
    PASSWORD_SCRYPT_P,
    toBase64Url(salt),
    toBase64Url(hash),
  ].join('$');
}

function encryptLocalStaffTotpSecret(secret: string): string {
  const key = createHash('sha256')
    .update(process.env.STAFF_TOTP_ENCRYPTION_KEY || DEFAULT_STAFF_TOTP_ENCRYPTION_KEY, 'utf8')
    .digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return ['v1', toBase64Url(iv), toBase64Url(cipher.getAuthTag()), toBase64Url(ciphertext)].join(
    '.',
  );
}

function hashLocalStaffRecoveryCode(code: string): string {
  return createHmac('sha256', process.env.AUTH_SECRET || DEFAULT_AUTH_SECRET)
    .update(`staff-recovery:${code}`)
    .digest('hex');
}

const DEMO_SEED_NOW = new Date('2026-09-01T09:00:00.000Z');

function demoSeedEnabled(): boolean {
  const rawValue = process.env.DEMO_SEED?.trim().toLowerCase();
  if (rawValue && rawValue !== 'true' && rawValue !== 'false') {
    throw new Error('DEMO_SEED must be true or false.');
  }

  const nodeEnvironment = process.env.NODE_ENV?.trim().toLowerCase() || 'development';
  if (!['development', 'test', 'staging', 'production'].includes(nodeEnvironment)) {
    throw new Error('NODE_ENV must be development, test, staging, or production.');
  }

  if (nodeEnvironment === 'production') {
    if (rawValue === 'true') {
      throw new Error(
        'DEMO_SEED=true is forbidden in production; refusing to seed synthetic demo data.',
      );
    }
    return false;
  }

  return rawValue !== 'false';
}

function requireSeededId(values: Map<string, string>, key: string, label: string): string {
  const value = values.get(key);
  if (!value) throw new Error(`Missing seeded ${label}: ${key}`);
  return value;
}

async function seedDemoContentAndSeo(): Promise<void> {
  const contentPages = [
    {
      id: 'demo-content-page-about',
      slug: 'about-nova',
      title: 'درباره نوا',
      body: 'نوا انتخابی آرام برای پوشیدن روزهای واقعی است؛ با تمرکز بر کیفیت، سادگی و ماندگاری.',
      blocks: [
        {
          id: 'demo-content-block-about-heading',
          kind: 'heading',
          payload: { text: 'لباس‌هایی برای زندگی روزمره', level: 2 },
          sortOrder: 0,
        },
        {
          id: 'demo-content-block-about-text',
          kind: 'rich-text',
          payload: {
            text: 'ما مجموعه‌ای کوچک و انتخاب‌شده از فرم‌های راحت، رنگ‌های آرام و پارچه‌های خوش‌دوخت را کنار هم آورده‌ایم.',
          },
          sortOrder: 1,
        },
        {
          id: 'demo-content-block-about-link',
          kind: 'link',
          payload: { label: 'مشاهده مجموعه‌ها', href: '/products' },
          sortOrder: 2,
        },
      ],
    },
    {
      id: 'demo-content-page-shipping-policy',
      slug: 'shipping-policy',
      title: 'راهنمای ارسال و مرجوعی',
      body: 'سفارش‌های نوا با بسته‌بندی ساده و قابل پیگیری به سراسر ایران ارسال می‌شوند.',
      blocks: [
        {
          id: 'demo-content-block-shipping-heading',
          kind: 'heading',
          payload: { text: 'ارسال و پیگیری سفارش', level: 2 },
          sortOrder: 0,
        },
        {
          id: 'demo-content-block-shipping-text',
          kind: 'paragraph',
          payload: {
            text: 'پس از آماده‌سازی، کد رهگیری در جزئیات سفارش نمایش داده می‌شود. برای تعویض یا مرجوعی، از حساب کاربری درخواست خود را ثبت کنید.',
          },
          sortOrder: 1,
        },
        {
          id: 'demo-content-block-shipping-quote',
          kind: 'quote',
          payload: { text: 'سادگی، بخشی از کیفیت تجربه شماست.', cite: 'تیم نوا' },
          sortOrder: 2,
        },
      ],
    },
  ];

  for (const pageDefinition of contentPages) {
    const page = await prisma.contentPage.upsert({
      where: { slug: pageDefinition.slug },
      update: {
        title: pageDefinition.title,
        body: pageDefinition.body,
        status: 'PUBLISHED',
        updatedAt: DEMO_SEED_NOW,
      },
      create: {
        id: pageDefinition.id,
        slug: pageDefinition.slug,
        title: pageDefinition.title,
        body: pageDefinition.body,
        status: 'PUBLISHED',
        createdAt: DEMO_SEED_NOW,
        updatedAt: DEMO_SEED_NOW,
      },
      select: { id: true },
    });

    for (const block of pageDefinition.blocks) {
      await prisma.contentBlock.upsert({
        where: { id: block.id },
        update: {
          contentPageId: page.id,
          kind: block.kind,
          payload: block.payload,
          sortOrder: block.sortOrder,
        },
        create: {
          id: block.id,
          contentPageId: page.id,
          kind: block.kind,
          payload: block.payload,
          sortOrder: block.sortOrder,
        },
      });
    }
  }

  const seoMetadata = [
    {
      path: '/content/about-nova',
      title: 'درباره نوا | پوشاک آرام و ماندگار',
      description: 'با رویکرد نوا به پوشاک روزمره، کیفیت پارچه و طراحی آرام آشنا شوید.',
      canonicalUrl: 'https://nova.example/content/about-nova',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'درباره نوا',
        url: 'https://nova.example/content/about-nova',
      },
    },
    {
      path: '/content/shipping-policy',
      title: 'راهنمای ارسال و مرجوعی | نوا',
      description: 'راهنمای زمان ارسال، پیگیری سفارش و ثبت درخواست مرجوعی در فروشگاه نوا.',
      canonicalUrl: 'https://nova.example/content/shipping-policy',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'راهنمای ارسال و مرجوعی',
        url: 'https://nova.example/content/shipping-policy',
      },
    },
    {
      path: '/products',
      title: 'مجموعه نوا | پوشاک روزمره',
      description: 'مجموعه‌ای از لباس‌ها و اکسسوری‌های منتخب نوا برای استایل روزمره.',
      canonicalUrl: 'https://nova.example/products',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'مجموعه نوا',
        url: 'https://nova.example/products',
      },
    },
  ];

  for (const metadata of seoMetadata) {
    await prisma.seoMetadata.upsert({
      where: { path: metadata.path },
      update: {
        title: metadata.title,
        description: metadata.description,
        canonicalUrl: metadata.canonicalUrl,
        noIndex: false,
        structuredData: metadata.structuredData,
        updatedAt: DEMO_SEED_NOW,
      },
      create: {
        path: metadata.path,
        title: metadata.title,
        description: metadata.description,
        canonicalUrl: metadata.canonicalUrl,
        noIndex: false,
        structuredData: metadata.structuredData,
        updatedAt: DEMO_SEED_NOW,
      },
    });
  }

  await prisma.redirect.upsert({
    where: { fromPath: '/content/journal' },
    update: { toPath: '/content/about-nova', statusCode: 301 },
    create: {
      id: 'demo-redirect-journal',
      fromPath: '/content/journal',
      toPath: '/content/about-nova',
      statusCode: 301,
      createdAt: DEMO_SEED_NOW,
    },
  });
}

async function seedDemoCustomerAndOrders(
  productIdsBySlug: Map<string, string>,
  variantIdsBySku: Map<string, string>,
): Promise<void> {
  const customer = await prisma.user.upsert({
    where: { phone: '+989120000101' },
    update: {
      email: 'demo.customer@nova.local',
      status: 'ACTIVE',
      phoneVerifiedAt: new Date('2026-09-01T09:05:00.000Z'),
      updatedAt: DEMO_SEED_NOW,
    },
    create: {
      id: 'demo-customer-2026',
      phone: '+989120000101',
      email: 'demo.customer@nova.local',
      status: 'ACTIVE',
      phoneVerifiedAt: new Date('2026-09-01T09:05:00.000Z'),
      createdAt: DEMO_SEED_NOW,
      updatedAt: DEMO_SEED_NOW,
    },
    select: { id: true },
  });

  await prisma.address.upsert({
    where: { id: 'demo-address-2026' },
    update: {
      userId: customer.id,
      label: 'خانه',
      recipientName: 'سارا نادری',
      phone: '+989120000101',
      province: 'تهران',
      city: 'تهران',
      addressLine: 'خیابان ولیعصر، کوچه نوا، پلاک ۲۴، واحد ۳',
      postalCode: '1431898765',
      isDefault: true,
      updatedAt: DEMO_SEED_NOW,
    },
    create: {
      id: 'demo-address-2026',
      userId: customer.id,
      label: 'خانه',
      recipientName: 'سارا نادری',
      phone: '+989120000101',
      province: 'تهران',
      city: 'تهران',
      addressLine: 'خیابان ولیعصر، کوچه نوا، پلاک ۲۴، واحد ۳',
      postalCode: '1431898765',
      isDefault: true,
      createdAt: DEMO_SEED_NOW,
      updatedAt: DEMO_SEED_NOW,
    },
  });

  const coupon = await prisma.coupon.upsert({
    where: { code: 'NOVA-DEMO-10' },
    update: {
      type: 'PERCENTAGE',
      amount: 10,
      minimumOrderToman: 1_500_000,
      activeFrom: new Date('2026-01-01T00:00:00.000Z'),
      activeUntil: new Date('2030-12-31T23:59:59.000Z'),
      maxRedemptions: 100,
      perUserLimit: 1,
      isActive: true,
      updatedAt: DEMO_SEED_NOW,
    },
    create: {
      id: 'demo-coupon-10-percent',
      code: 'NOVA-DEMO-10',
      type: 'PERCENTAGE',
      amount: 10,
      minimumOrderToman: 1_500_000,
      activeFrom: new Date('2026-01-01T00:00:00.000Z'),
      activeUntil: new Date('2030-12-31T23:59:59.000Z'),
      maxRedemptions: 100,
      perUserLimit: 1,
      isActive: true,
      createdAt: DEMO_SEED_NOW,
      updatedAt: DEMO_SEED_NOW,
    },
    select: { id: true },
  });

  const linenProductId = requireSeededId(productIdsBySlug, 'linen-overshirt', 'product');
  const linenVariantId = requireSeededId(variantIdsBySku, 'NOVA-LINEN-001-M', 'variant');
  const scarfProductId = requireSeededId(productIdsBySlug, 'textured-scarf', 'product');
  const scarfVariantId = requireSeededId(variantIdsBySku, 'NOVA-SCARF-004-ONE', 'variant');
  const kidsProductId = requireSeededId(productIdsBySlug, 'kids-knit-set', 'product');
  const kidsVariantId = requireSeededId(variantIdsBySku, 'NOVA-KIDS-003-8', 'variant');

  const orderOneCreatedAt = new Date('2026-09-03T10:30:00.000Z');
  const orderOne = await prisma.order.upsert({
    where: { orderNumber: 'DEMO-1001' },
    update: {
      userId: customer.id,
      cartId: null,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      moneyUnit: 'TOMAN',
      subtotalToman: 3_380_000,
      discountToman: 338_000,
      shippingToman: 85_000,
      taxToman: 0,
      totalToman: 3_127_000,
      idempotencyKey: 'demo-checkout-1001',
      createdAt: orderOneCreatedAt,
      updatedAt: DEMO_SEED_NOW,
    },
    create: {
      id: 'demo-order-1001',
      orderNumber: 'DEMO-1001',
      userId: customer.id,
      cartId: null,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      moneyUnit: 'TOMAN',
      subtotalToman: 3_380_000,
      discountToman: 338_000,
      shippingToman: 85_000,
      taxToman: 0,
      totalToman: 3_127_000,
      idempotencyKey: 'demo-checkout-1001',
      createdAt: orderOneCreatedAt,
      updatedAt: DEMO_SEED_NOW,
    },
    select: { id: true },
  });

  await prisma.orderItem.upsert({
    where: { id: 'demo-order-item-1001-linen' },
    update: {
      orderId: orderOne.id,
      productId: linenProductId,
      variantId: linenVariantId,
      productNameSnapshot: 'مانتوی لینن کمربندی آوا',
      skuSnapshot: 'NOVA-LINEN-001-M',
      variantSnapshot: {
        title: 'کرم / M',
        size: 'M',
        color: 'کرم',
        colorHex: '#d9c8ad',
      },
      quantity: 1,
      unitPriceToman: 2_490_000,
      compareAtPriceToman: 2_890_000,
      discountToman: 249_000,
      taxToman: 0,
      totalToman: 2_241_000,
    },
    create: {
      id: 'demo-order-item-1001-linen',
      orderId: orderOne.id,
      productId: linenProductId,
      variantId: linenVariantId,
      productNameSnapshot: 'مانتوی لینن کمربندی آوا',
      skuSnapshot: 'NOVA-LINEN-001-M',
      variantSnapshot: {
        title: 'کرم / M',
        size: 'M',
        color: 'کرم',
        colorHex: '#d9c8ad',
      },
      quantity: 1,
      unitPriceToman: 2_490_000,
      compareAtPriceToman: 2_890_000,
      discountToman: 249_000,
      taxToman: 0,
      totalToman: 2_241_000,
    },
    select: { id: true },
  });

  await prisma.orderItem.upsert({
    where: { id: 'demo-order-item-1001-scarf' },
    update: {
      orderId: orderOne.id,
      productId: scarfProductId,
      variantId: scarfVariantId,
      productNameSnapshot: 'شال بافت برجسته',
      skuSnapshot: 'NOVA-SCARF-004-ONE',
      variantSnapshot: {
        title: 'خاکی / تک‌سایز',
        size: null,
        color: 'خاکی',
        colorHex: '#9b8b78',
      },
      quantity: 1,
      unitPriceToman: 890_000,
      compareAtPriceToman: null,
      discountToman: 89_000,
      taxToman: 0,
      totalToman: 801_000,
    },
    create: {
      id: 'demo-order-item-1001-scarf',
      orderId: orderOne.id,
      productId: scarfProductId,
      variantId: scarfVariantId,
      productNameSnapshot: 'شال بافت برجسته',
      skuSnapshot: 'NOVA-SCARF-004-ONE',
      variantSnapshot: {
        title: 'خاکی / تک‌سایز',
        size: null,
        color: 'خاکی',
        colorHex: '#9b8b78',
      },
      quantity: 1,
      unitPriceToman: 890_000,
      compareAtPriceToman: null,
      discountToman: 89_000,
      taxToman: 0,
      totalToman: 801_000,
    },
  });

  await prisma.orderAddressSnapshot.upsert({
    where: { orderId: orderOne.id },
    update: {
      recipientName: 'سارا نادری',
      phone: '+989120000101',
      province: 'تهران',
      city: 'تهران',
      addressLine: 'خیابان ولیعصر، کوچه نوا، پلاک ۲۴، واحد ۳',
      postalCode: '1431898765',
    },
    create: {
      id: 'demo-order-address-1001',
      orderId: orderOne.id,
      recipientName: 'سارا نادری',
      phone: '+989120000101',
      province: 'تهران',
      city: 'تهران',
      addressLine: 'خیابان ولیعصر، کوچه نوا، پلاک ۲۴، واحد ۳',
      postalCode: '1431898765',
    },
  });

  await prisma.paymentAttempt.upsert({
    where: {
      orderId_idempotencyKey: {
        orderId: orderOne.id,
        idempotencyKey: 'demo-payment-1001',
      },
    },
    update: {
      provider: 'local',
      providerTransactionId: 'local-demo-tx-1001',
      providerEventId: 'local-demo-event-1001',
      status: 'SUCCEEDED',
      amountToman: 3_127_000,
      redirectUrl: null,
      rawPayloadHash: 'demo-payment-payload-hash-1001',
      updatedAt: DEMO_SEED_NOW,
      paidAt: new Date('2026-09-03T10:36:00.000Z'),
    },
    create: {
      id: 'demo-payment-attempt-1001',
      orderId: orderOne.id,
      provider: 'local',
      providerTransactionId: 'local-demo-tx-1001',
      providerEventId: 'local-demo-event-1001',
      status: 'SUCCEEDED',
      amountToman: 3_127_000,
      redirectUrl: null,
      idempotencyKey: 'demo-payment-1001',
      rawPayloadHash: 'demo-payment-payload-hash-1001',
      createdAt: orderOneCreatedAt,
      updatedAt: DEMO_SEED_NOW,
      paidAt: new Date('2026-09-03T10:36:00.000Z'),
    },
    select: { id: true },
  });

  await prisma.shipment.upsert({
    where: { orderId: orderOne.id },
    update: {
      provider: 'local',
      method: 'STANDARD',
      trackingReference: 'NOVA-DEMO-1001',
      status: 'DELIVERED',
      shippingToman: 85_000,
      shippedAt: new Date('2026-09-04T08:00:00.000Z'),
      deliveredAt: new Date('2026-09-06T14:00:00.000Z'),
      updatedAt: DEMO_SEED_NOW,
    },
    create: {
      id: 'demo-shipment-1001',
      orderId: orderOne.id,
      provider: 'local',
      method: 'STANDARD',
      trackingReference: 'NOVA-DEMO-1001',
      status: 'DELIVERED',
      shippingToman: 85_000,
      shippedAt: new Date('2026-09-04T08:00:00.000Z'),
      deliveredAt: new Date('2026-09-06T14:00:00.000Z'),
      createdAt: orderOneCreatedAt,
      updatedAt: DEMO_SEED_NOW,
    },
  });

  await prisma.promotionRedemption.upsert({
    where: { orderId: orderOne.id },
    update: {
      promotionId: null,
      couponId: coupon.id,
      userId: customer.id,
      status: 'COMMITTED',
      reservedUntil: null,
      committedAt: new Date('2026-09-03T10:36:00.000Z'),
      releasedAt: null,
      createdAt: orderOneCreatedAt,
    },
    create: {
      id: 'demo-promotion-redemption-1001',
      promotionId: null,
      couponId: coupon.id,
      userId: customer.id,
      orderId: orderOne.id,
      status: 'COMMITTED',
      reservedUntil: null,
      committedAt: new Date('2026-09-03T10:36:00.000Z'),
      releasedAt: null,
      createdAt: orderOneCreatedAt,
    },
  });

  for (const event of [
    {
      id: 'demo-order-event-1001-confirmed',
      fromStatus: 'PENDING_PAYMENT',
      toStatus: 'CONFIRMED',
      reason: 'پرداخت دمو با موفقیت تأیید شد.',
      createdAt: new Date('2026-09-03T10:36:00.000Z'),
    },
    {
      id: 'demo-order-event-1001-preparing',
      fromStatus: 'CONFIRMED',
      toStatus: 'PREPARING',
      reason: 'سفارش برای بسته‌بندی آماده شد.',
      createdAt: new Date('2026-09-03T15:00:00.000Z'),
    },
    {
      id: 'demo-order-event-1001-shipped',
      fromStatus: 'PREPARING',
      toStatus: 'SHIPPED',
      reason: 'بسته به ارسال‌کننده تحویل شد.',
      createdAt: new Date('2026-09-04T08:00:00.000Z'),
    },
    {
      id: 'demo-order-event-1001-delivered',
      fromStatus: 'SHIPPED',
      toStatus: 'DELIVERED',
      reason: 'سفارش تحویل داده شد.',
      createdAt: new Date('2026-09-06T14:00:00.000Z'),
    },
  ] as const) {
    await prisma.orderEvent.upsert({
      where: { id: event.id },
      update: {
        orderId: orderOne.id,
        actorType: 'SYSTEM',
        actorId: null,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        reason: event.reason,
        createdAt: event.createdAt,
      },
      create: {
        id: event.id,
        orderId: orderOne.id,
        actorType: 'SYSTEM',
        actorId: null,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        reason: event.reason,
        createdAt: event.createdAt,
      },
    });
  }

  const orderTwoCreatedAt = new Date('2026-09-08T11:15:00.000Z');
  const orderTwo = await prisma.order.upsert({
    where: { orderNumber: 'DEMO-1002' },
    update: {
      userId: customer.id,
      cartId: null,
      status: 'RETURNED',
      paymentStatus: 'REFUNDED',
      moneyUnit: 'TOMAN',
      subtotalToman: 1_690_000,
      discountToman: 0,
      shippingToman: 85_000,
      taxToman: 0,
      totalToman: 1_775_000,
      idempotencyKey: 'demo-checkout-1002',
      createdAt: orderTwoCreatedAt,
      updatedAt: DEMO_SEED_NOW,
    },
    create: {
      id: 'demo-order-1002',
      orderNumber: 'DEMO-1002',
      userId: customer.id,
      cartId: null,
      status: 'RETURNED',
      paymentStatus: 'REFUNDED',
      moneyUnit: 'TOMAN',
      subtotalToman: 1_690_000,
      discountToman: 0,
      shippingToman: 85_000,
      taxToman: 0,
      totalToman: 1_775_000,
      idempotencyKey: 'demo-checkout-1002',
      createdAt: orderTwoCreatedAt,
      updatedAt: DEMO_SEED_NOW,
    },
    select: { id: true },
  });

  const orderTwoItem = await prisma.orderItem.upsert({
    where: { id: 'demo-order-item-1002-kids' },
    update: {
      orderId: orderTwo.id,
      productId: kidsProductId,
      variantId: kidsVariantId,
      productNameSnapshot: 'ست دورس و شلوار کودک',
      skuSnapshot: 'NOVA-KIDS-003-8',
      variantSnapshot: {
        title: 'زیتونی / ۸ سال',
        size: '8Y',
        color: 'زیتونی',
        colorHex: '#65705b',
      },
      quantity: 1,
      unitPriceToman: 1_690_000,
      compareAtPriceToman: null,
      discountToman: 0,
      taxToman: 0,
      totalToman: 1_690_000,
    },
    create: {
      id: 'demo-order-item-1002-kids',
      orderId: orderTwo.id,
      productId: kidsProductId,
      variantId: kidsVariantId,
      productNameSnapshot: 'ست دورس و شلوار کودک',
      skuSnapshot: 'NOVA-KIDS-003-8',
      variantSnapshot: {
        title: 'زیتونی / ۸ سال',
        size: '8Y',
        color: 'زیتونی',
        colorHex: '#65705b',
      },
      quantity: 1,
      unitPriceToman: 1_690_000,
      compareAtPriceToman: null,
      discountToman: 0,
      taxToman: 0,
      totalToman: 1_690_000,
    },
    select: { id: true },
  });

  await prisma.orderAddressSnapshot.upsert({
    where: { orderId: orderTwo.id },
    update: {
      recipientName: 'سارا نادری',
      phone: '+989120000101',
      province: 'تهران',
      city: 'تهران',
      addressLine: 'خیابان ولیعصر، کوچه نوا، پلاک ۲۴، واحد ۳',
      postalCode: '1431898765',
    },
    create: {
      id: 'demo-order-address-1002',
      orderId: orderTwo.id,
      recipientName: 'سارا نادری',
      phone: '+989120000101',
      province: 'تهران',
      city: 'تهران',
      addressLine: 'خیابان ولیعصر، کوچه نوا، پلاک ۲۴، واحد ۳',
      postalCode: '1431898765',
    },
  });

  const paymentTwo = await prisma.paymentAttempt.upsert({
    where: {
      orderId_idempotencyKey: {
        orderId: orderTwo.id,
        idempotencyKey: 'demo-payment-1002',
      },
    },
    update: {
      provider: 'local',
      providerTransactionId: 'local-demo-tx-1002',
      providerEventId: 'local-demo-event-1002',
      status: 'SUCCEEDED',
      amountToman: 1_775_000,
      redirectUrl: null,
      rawPayloadHash: 'demo-payment-payload-hash-1002',
      updatedAt: DEMO_SEED_NOW,
      paidAt: new Date('2026-09-08T11:22:00.000Z'),
    },
    create: {
      id: 'demo-payment-attempt-1002',
      orderId: orderTwo.id,
      provider: 'local',
      providerTransactionId: 'local-demo-tx-1002',
      providerEventId: 'local-demo-event-1002',
      status: 'SUCCEEDED',
      amountToman: 1_775_000,
      redirectUrl: null,
      idempotencyKey: 'demo-payment-1002',
      rawPayloadHash: 'demo-payment-payload-hash-1002',
      createdAt: orderTwoCreatedAt,
      updatedAt: DEMO_SEED_NOW,
      paidAt: new Date('2026-09-08T11:22:00.000Z'),
    },
    select: { id: true },
  });

  await prisma.shipment.upsert({
    where: { orderId: orderTwo.id },
    update: {
      provider: 'local',
      method: 'STANDARD',
      trackingReference: 'NOVA-DEMO-1002',
      status: 'RETURNED',
      shippingToman: 85_000,
      shippedAt: new Date('2026-09-09T08:00:00.000Z'),
      deliveredAt: new Date('2026-09-11T13:00:00.000Z'),
      updatedAt: DEMO_SEED_NOW,
    },
    create: {
      id: 'demo-shipment-1002',
      orderId: orderTwo.id,
      provider: 'local',
      method: 'STANDARD',
      trackingReference: 'NOVA-DEMO-1002',
      status: 'RETURNED',
      shippingToman: 85_000,
      shippedAt: new Date('2026-09-09T08:00:00.000Z'),
      deliveredAt: new Date('2026-09-11T13:00:00.000Z'),
      createdAt: orderTwoCreatedAt,
      updatedAt: DEMO_SEED_NOW,
    },
  });

  const returnRequest = await prisma.returnRequest.upsert({
    where: { orderId: orderTwo.id },
    update: {
      userId: customer.id,
      reason: 'SIZE_PREFERENCE',
      note: 'سایز انتخابی برای کودک مناسب نبود.',
      status: 'REFUNDED',
      requestedAt: new Date('2026-09-12T09:00:00.000Z'),
      reviewedAt: new Date('2026-09-12T12:00:00.000Z'),
      reviewedByStaffId: null,
      receivedAt: new Date('2026-09-15T15:30:00.000Z'),
      updatedAt: DEMO_SEED_NOW,
    },
    create: {
      id: 'demo-return-request-1002',
      orderId: orderTwo.id,
      userId: customer.id,
      reason: 'SIZE_PREFERENCE',
      note: 'سایز انتخابی برای کودک مناسب نبود.',
      status: 'REFUNDED',
      requestedAt: new Date('2026-09-12T09:00:00.000Z'),
      reviewedAt: new Date('2026-09-12T12:00:00.000Z'),
      reviewedByStaffId: null,
      receivedAt: new Date('2026-09-15T15:30:00.000Z'),
      createdAt: new Date('2026-09-12T09:00:00.000Z'),
      updatedAt: DEMO_SEED_NOW,
    },
    select: { id: true },
  });

  await prisma.returnItem.upsert({
    where: {
      returnRequestId_orderItemId: {
        returnRequestId: returnRequest.id,
        orderItemId: orderTwoItem.id,
      },
    },
    update: { quantity: 1 },
    create: {
      id: 'demo-return-item-1002-kids',
      returnRequestId: returnRequest.id,
      orderItemId: orderTwoItem.id,
      quantity: 1,
    },
  });

  await prisma.refund.upsert({
    where: { idempotencyKey: 'demo-refund-1002' },
    update: {
      orderId: orderTwo.id,
      paymentAttemptId: paymentTwo.id,
      returnRequestId: returnRequest.id,
      provider: 'local',
      amountToman: 1_775_000,
      status: 'SUCCEEDED',
      providerRefundId: 'local-demo-refund-1002',
      reason: 'مرجوعی تأییدشده به دلیل انتخاب سایز',
      updatedAt: DEMO_SEED_NOW,
      completedAt: new Date('2026-09-16T10:00:00.000Z'),
    },
    create: {
      id: 'demo-refund-1002',
      orderId: orderTwo.id,
      paymentAttemptId: paymentTwo.id,
      returnRequestId: returnRequest.id,
      provider: 'local',
      amountToman: 1_775_000,
      status: 'SUCCEEDED',
      providerRefundId: 'local-demo-refund-1002',
      idempotencyKey: 'demo-refund-1002',
      reason: 'مرجوعی تأییدشده به دلیل انتخاب سایز',
      createdAt: new Date('2026-09-16T09:55:00.000Z'),
      updatedAt: DEMO_SEED_NOW,
      completedAt: new Date('2026-09-16T10:00:00.000Z'),
    },
  });

  for (const event of [
    {
      id: 'demo-order-event-1002-confirmed',
      fromStatus: 'PENDING_PAYMENT',
      toStatus: 'CONFIRMED',
      reason: 'پرداخت دمو با موفقیت تأیید شد.',
      createdAt: new Date('2026-09-08T11:22:00.000Z'),
    },
    {
      id: 'demo-order-event-1002-preparing',
      fromStatus: 'CONFIRMED',
      toStatus: 'PREPARING',
      reason: 'سفارش برای بسته‌بندی آماده شد.',
      createdAt: new Date('2026-09-08T16:00:00.000Z'),
    },
    {
      id: 'demo-order-event-1002-shipped',
      fromStatus: 'PREPARING',
      toStatus: 'SHIPPED',
      reason: 'بسته به ارسال‌کننده تحویل شد.',
      createdAt: new Date('2026-09-09T08:00:00.000Z'),
    },
    {
      id: 'demo-order-event-1002-delivered',
      fromStatus: 'SHIPPED',
      toStatus: 'DELIVERED',
      reason: 'سفارش تحویل داده شد.',
      createdAt: new Date('2026-09-11T13:00:00.000Z'),
    },
    {
      id: 'demo-order-event-1002-returned',
      fromStatus: 'DELIVERED',
      toStatus: 'RETURNED',
      reason: 'مرجوعی پس از دریافت کالا تأیید شد.',
      createdAt: new Date('2026-09-15T15:30:00.000Z'),
    },
  ] as const) {
    await prisma.orderEvent.upsert({
      where: { id: event.id },
      update: {
        orderId: orderTwo.id,
        actorType: 'SYSTEM',
        actorId: null,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        reason: event.reason,
        createdAt: event.createdAt,
      },
      create: {
        id: event.id,
        orderId: orderTwo.id,
        actorType: 'SYSTEM',
        actorId: null,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        reason: event.reason,
        createdAt: event.createdAt,
      },
    });
  }

  console.log('Seeded demo coupon, content/SEO, customer, paid orders, and return/refund data.');
}

async function seedLocalStaffFixture(adminRoleId: string): Promise<void> {
  const fixture = localStaffFixture();
  const passwordHash = hashLocalStaffPassword(fixture.password);
  const totpSecretEncrypted = encryptLocalStaffTotpSecret(fixture.totpSecret);
  const recoveryCodeHash = hashLocalStaffRecoveryCode(fixture.recoveryCode);

  const user = await prisma.user.upsert({
    where: { email: fixture.email },
    update: {
      phone: fixture.phone,
      status: 'ACTIVE',
      staffCredential: {
        upsert: {
          update: {
            passwordHash,
            totpSecretEncrypted,
            failedAttempts: 0,
            lockedUntil: null,
          },
          create: { passwordHash, totpSecretEncrypted },
        },
      },
    },
    create: {
      phone: fixture.phone,
      email: fixture.email,
      status: 'ACTIVE',
      staffCredential: {
        create: { passwordHash, totpSecretEncrypted },
      },
    },
    select: { id: true },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: adminRoleId,
      },
    },
    update: {},
    create: { userId: user.id, roleId: adminRoleId },
  });

  await prisma.staffRecoveryCode.upsert({
    where: {
      userId_codeHash: {
        userId: user.id,
        codeHash: recoveryCodeHash,
      },
    },
    update: { usedAt: null },
    create: { userId: user.id, codeHash: recoveryCodeHash },
  });

  console.log(`Seeded local staff fixture: ${fixture.email} (admin role).`);
}

const ZERO_WIDTH_CHARACTERS = /(?:\u200B|\u200C|\u200D|\u2060|\uFEFF)/gu;
const SEARCH_PUNCTUATION = /[^\p{L}\p{N}\s_-]/gu;
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const WESTERN_DIGITS = '0123456789';

function normalizeSearchableText(value: string): string {
  return value
    .normalize('NFC')
    .replace(ZERO_WIDTH_CHARACTERS, ' ')
    .replace(/[يى]/gu, 'ی')
    .replace(/ك/gu, 'ک')
    .replace(/[ۀة]/gu, 'ه')
    .replace(/[إأٱ]/gu, 'ا')
    .replace(/[٠-٩۰-۹]/gu, (digit) => {
      const arabicIndex = ARABIC_DIGITS.indexOf(digit);
      const digitIndex = arabicIndex >= 0 ? arabicIndex : PERSIAN_DIGITS.indexOf(digit);
      return digitIndex >= 0 ? WESTERN_DIGITS[digitIndex] : digit;
    })
    .replace(SEARCH_PUNCTUATION, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLocaleLowerCase('fa-IR');
}

async function main(): Promise<void> {
  const enableDemoSeed = demoSeedEnabled();
  const enableLocalStaffFixture = localTestModeEnabled();
  if (!enableDemoSeed) {
    console.log('DEMO_SEED is disabled; synthetic demo data was not seeded.');
    return;
  }

  const permissions = [
    ['catalog.read', 'Read catalog data'],
    ['catalog.write', 'Create and edit catalog data'],
    ['orders.read', 'Read order data'],
    ['orders.fulfill', 'Change fulfillment status'],
    ['refunds.request', 'Request a refund'],
    ['refunds.approve', 'Approve and execute a refund'],
  ] as const;

  const permissionRecords = new Map<string, string>();
  for (const [key, description] of permissions) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
    permissionRecords.set(key, permission.id);
  }

  const roleDefinitions = [
    ['support', 'پشتیبانی', ['catalog.read', 'orders.read', 'refunds.request']],
    ['operations', 'عملیات', ['catalog.read', 'orders.read', 'orders.fulfill']],
    ['admin', 'مدیر', permissions.map(([key]) => key)],
  ] as const;

  for (const [key, name, rolePermissions] of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { key },
      update: { name },
      create: { key, name },
    });

    for (const permissionKey of rolePermissions) {
      const permissionId = permissionRecords.get(permissionKey);
      if (!permissionId) {
        throw new Error(`Missing seeded permission: ${permissionKey}`);
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId,
          },
        },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  if (enableLocalStaffFixture) {
    const adminRole = await prisma.role.findUnique({
      where: { key: 'admin' },
      select: { id: true },
    });
    if (!adminRole) throw new Error('Missing seeded role: admin');
    await seedLocalStaffFixture(adminRole.id);
  }

  const categories = await Promise.all(
    [
      ['women', 'زنانه'],
      ['men', 'مردانه'],
      ['children', 'بچگانه'],
      ['accessories', 'اکسسوری'],
      ['outerwear', 'مانتو و رویه'],
      ['shirts', 'پیراهن'],
      ['kidswear', 'لباس کودک'],
      ['trousers', 'شلوار'],
      ['knitwear', 'بافت'],
    ].map(([slug, name]) =>
      prisma.category.upsert({
        where: { slug },
        update: { name },
        create: { slug, name },
      }),
    ),
  );

  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
  const productDefinitions = [
    {
      slug: 'linen-overshirt',
      name: 'مانتوی لینن کمربندی آوا',
      shortDescription: 'لایه‌ای سبک برای روزهای گرم و استایل روزمره.',
      description: 'پارچه لینن سبک با برش آزاد، کمربند قابل تنظیم و دکمه‌های چوبی.',
      basePriceToman: 2_490_000,
      compareAtPriceToman: 2_890_000,
      image: '/assets/nova-product-linen-overshirt.webp',
      altText: 'مانتوی لینن روشن با کمربند پارچه‌ای',
      categorySlugs: ['women', 'outerwear'],
      attributes: { material: 'لینن', fit: 'آزاد', care: 'شست‌وشوی ملایم' },
      variants: [
        {
          sku: 'NOVA-LINEN-001-S',
          title: 'کرم / S',
          size: 'S',
          color: 'کرم',
          colorHex: '#d9c8ad',
          onHand: 8,
        },
        {
          sku: 'NOVA-LINEN-001-M',
          title: 'کرم / M',
          size: 'M',
          color: 'کرم',
          colorHex: '#d9c8ad',
          onHand: 24,
        },
        {
          sku: 'NOVA-LINEN-001-L',
          title: 'کرم / L',
          size: 'L',
          color: 'کرم',
          colorHex: '#d9c8ad',
          onHand: 5,
        },
      ],
    },
    {
      slug: 'oxford-shirt',
      name: 'پیراهن آکسفورد مردانه',
      shortDescription: 'پیراهنی روزمره با فرم تمیز و پارچه خوش‌دست.',
      description: 'آکسفورد پنبه‌ای با یقه کلاسیک و برش راحت برای استفاده روزمره.',
      basePriceToman: 1_890_000,
      compareAtPriceToman: null,
      image: '/assets/nova-product-oxford-shirt.webp',
      altText: 'پیراهن آکسفورد آبی روشن',
      categorySlugs: ['men', 'shirts'],
      attributes: { material: 'پنبه', fit: 'راحت', care: 'شست‌وشوی ماشینی ملایم' },
      variants: [
        {
          sku: 'NOVA-OX-002-M',
          title: 'آبی / M',
          size: 'M',
          color: 'آبی',
          colorHex: '#b7c7dc',
          onHand: 12,
        },
        {
          sku: 'NOVA-OX-002-L',
          title: 'آبی / L',
          size: 'L',
          color: 'آبی',
          colorHex: '#b7c7dc',
          onHand: 9,
        },
      ],
    },
    {
      slug: 'kids-knit-set',
      name: 'ست دورس و شلوار کودک',
      shortDescription: 'ست راحت و مقاوم برای بازی‌های تمام‌نشدنی.',
      description: 'دورس نرم با فرم آزاد و کش راحت، مناسب حرکت و بازی روزانه.',
      basePriceToman: 1_690_000,
      compareAtPriceToman: null,
      image: '/assets/nova-product-kids-set.webp',
      altText: 'ست دورس سبز زیتونی کودک',
      categorySlugs: ['children', 'kidswear'],
      attributes: { material: 'پنبه', fit: 'راحت', care: 'شست‌وشوی ملایم' },
      variants: [
        {
          sku: 'NOVA-KIDS-003-6',
          title: 'زیتونی / ۶ سال',
          size: '6Y',
          color: 'زیتونی',
          colorHex: '#65705b',
          onHand: 11,
        },
        {
          sku: 'NOVA-KIDS-003-8',
          title: 'زیتونی / ۸ سال',
          size: '8Y',
          color: 'زیتونی',
          colorHex: '#65705b',
          onHand: 7,
        },
      ],
    },
    {
      slug: 'textured-scarf',
      name: 'شال بافت برجسته',
      shortDescription: 'اکسسوری آرام برای کامل‌کردن لایه‌های فصل.',
      description: 'شالی سبک با بافت برجسته و رنگ‌های خنثی که با استایل‌های مختلف همراه می‌شود.',
      basePriceToman: 890_000,
      compareAtPriceToman: null,
      image: '/assets/nova-product-textured-scarf.webp',
      altText: 'شال بافتنی با رنگ خنثی',
      categorySlugs: ['accessories'],
      attributes: { material: 'بافت', size: '۱۸۰ × ۷۰ سانتی‌متر', care: 'شست‌وشوی دستی' },
      variants: [
        {
          sku: 'NOVA-SCARF-004-ONE',
          title: 'خاکی / تک‌سایز',
          size: null,
          color: 'خاکی',
          colorHex: '#9b8b78',
          onHand: 15,
        },
      ],
    },
    {
      slug: 'soft-trousers',
      name: 'شلوار نرم و راسته',
      shortDescription: 'فرمی ساده با پارچه‌ای نرم برای روزهای طولانی.',
      description: 'شلوار راسته با کمر راحت و پارچه‌ای که برای استفاده روزمره انتخاب شده است.',
      basePriceToman: 1_990_000,
      compareAtPriceToman: null,
      image: '/assets/nova-product-soft-trousers.webp',
      altText: 'شلوار پارچه‌ای نرم به رنگ خاکی',
      categorySlugs: ['women', 'trousers'],
      attributes: { material: 'پنبه', fit: 'راسته', care: 'شست‌وشوی ملایم' },
      variants: [
        {
          sku: 'NOVA-TROUSER-005-S',
          title: 'خاکی / S',
          size: 'S',
          color: 'خاکی',
          colorHex: '#b1a394',
          onHand: 4,
        },
        {
          sku: 'NOVA-TROUSER-005-M',
          title: 'خاکی / M',
          size: 'M',
          color: 'خاکی',
          colorHex: '#b1a394',
          onHand: 2,
        },
        {
          sku: 'NOVA-TROUSER-005-L',
          title: 'خاکی / L',
          size: 'L',
          color: 'خاکی',
          colorHex: '#b1a394',
          onHand: 0,
        },
      ],
    },
    {
      slug: 'knit-cardigan',
      name: 'ژاکت بافت یقه‌گرد',
      shortDescription: 'بافت روزمره‌ای برای لایه‌سازی آرام فصل.',
      description: 'ژاکت بافت یقه‌گرد با فرم نرم و رنگی که به‌راحتی با کمد شما هماهنگ می‌شود.',
      basePriceToman: 2_190_000,
      compareAtPriceToman: null,
      image: '/assets/nova-product-knit-cardigan.webp',
      altText: 'ژاکت بافتنی قهوه‌ای روشن',
      categorySlugs: ['women', 'knitwear'],
      attributes: { material: 'بافت', fit: 'آزاد', care: 'شست‌وشوی دستی' },
      variants: [
        {
          sku: 'NOVA-KNIT-006-S',
          title: 'قهوه‌ای / S',
          size: 'S',
          color: 'قهوه‌ای',
          colorHex: '#817464',
          onHand: 6,
        },
        {
          sku: 'NOVA-KNIT-006-M',
          title: 'قهوه‌ای / M',
          size: 'M',
          color: 'قهوه‌ای',
          colorHex: '#817464',
          onHand: 9,
        },
        {
          sku: 'NOVA-KNIT-006-L',
          title: 'قهوه‌ای / L',
          size: 'L',
          color: 'قهوه‌ای',
          colorHex: '#817464',
          onHand: 6,
        },
      ],
    },
  ] as const;

  const productIdsBySlug = new Map<string, string>();
  const variantIdsBySku = new Map<string, string>();

  for (const definition of productDefinitions) {
    const categoryLabels = definition.categorySlugs.map(
      (categorySlug) => categoryBySlug.get(categorySlug)?.name ?? categorySlug,
    );
    const searchText = normalizeSearchableText(
      [
        definition.name,
        definition.shortDescription,
        definition.description,
        ...categoryLabels,
        ...Object.values(definition.attributes),
        ...definition.variants.flatMap((variant) => [
          variant.sku,
          variant.title,
          variant.size,
          variant.color,
        ]),
      ]
        .filter((value): value is string => Boolean(value))
        .join(' '),
    );
    const product = await prisma.product.upsert({
      where: { slug: definition.slug },
      update: {
        name: definition.name,
        searchText,
        shortDescription: definition.shortDescription,
        description: definition.description,
        status: 'PUBLISHED',
        basePriceToman: definition.basePriceToman,
        compareAtPriceToman: definition.compareAtPriceToman,
        publishedAt: DEMO_SEED_NOW,
        archivedAt: null,
      },
      create: {
        slug: definition.slug,
        name: definition.name,
        searchText,
        shortDescription: definition.shortDescription,
        description: definition.description,
        status: 'PUBLISHED',
        basePriceToman: definition.basePriceToman,
        compareAtPriceToman: definition.compareAtPriceToman,
        publishedAt: DEMO_SEED_NOW,
      },
    });
    productIdsBySlug.set(definition.slug, product.id);

    for (const categorySlug of definition.categorySlugs) {
      const category = categoryBySlug.get(categorySlug);
      if (!category) throw new Error(`Missing seeded category: ${categorySlug}`);

      await prisma.productCategory.upsert({
        where: {
          productId_categoryId: {
            productId: product.id,
            categoryId: category.id,
          },
        },
        update: {},
        create: { productId: product.id, categoryId: category.id },
      });
    }

    const existingMedia = await prisma.productMedia.findFirst({
      where: { productId: product.id, kind: 'PRODUCT', sortOrder: 0 },
    });
    if (existingMedia) {
      await prisma.productMedia.update({
        where: { id: existingMedia.id },
        data: { url: definition.image, altText: definition.altText },
      });
    } else {
      await prisma.productMedia.create({
        data: {
          productId: product.id,
          url: definition.image,
          altText: definition.altText,
          kind: 'PRODUCT',
          sortOrder: 0,
        },
      });
    }

    const variantIds = new Map<string, string>();
    for (const variantDefinition of definition.variants) {
      const variant = await prisma.productVariant.upsert({
        where: { sku: variantDefinition.sku },
        update: {
          productId: product.id,
          title: variantDefinition.title,
          size: variantDefinition.size,
          color: variantDefinition.color,
          colorHex: variantDefinition.colorHex,
          priceToman: definition.basePriceToman,
          compareAtPriceToman: definition.compareAtPriceToman,
          isActive: true,
        },
        create: {
          productId: product.id,
          sku: variantDefinition.sku,
          title: variantDefinition.title,
          size: variantDefinition.size,
          color: variantDefinition.color,
          colorHex: variantDefinition.colorHex,
          priceToman: definition.basePriceToman,
          compareAtPriceToman: definition.compareAtPriceToman,
        },
      });
      variantIds.set(variantDefinition.sku, variant.id);
      variantIdsBySku.set(variantDefinition.sku, variant.id);

      await prisma.inventoryItem.upsert({
        where: { variantId: variant.id },
        update: {
          onHand: variantDefinition.onHand,
          reorderPoint: variantDefinition.onHand <= 5 ? 4 : 2,
        },
        create: {
          variantId: variant.id,
          onHand: variantDefinition.onHand,
          reorderPoint: variantDefinition.onHand <= 5 ? 4 : 2,
        },
      });
    }

    const optionDefinitions = [
      {
        key: 'color',
        name: 'رنگ',
        values: [
          ...new Set(
            definition.variants
              .map((variant) => variant.color)
              .filter((value): value is Exclude<typeof value, null> => value !== null),
          ),
        ],
      },
      {
        key: 'size',
        name: 'اندازه',
        values: [
          ...new Set(
            definition.variants
              .map((variant) => variant.size)
              .filter((value): value is Exclude<typeof value, null> => value !== null),
          ),
        ],
      },
    ].filter((optionDefinition) => optionDefinition.values.length > 0);

    for (const [sortOrder, optionDefinition] of optionDefinitions.entries()) {
      const option = await prisma.productOption.upsert({
        where: {
          productId_key: {
            productId: product.id,
            key: optionDefinition.key,
          },
        },
        update: {
          name: optionDefinition.name,
          sortOrder,
        },
        create: {
          productId: product.id,
          key: optionDefinition.key,
          name: optionDefinition.name,
          sortOrder,
        },
      });
      const valueIds = new Map<string, string>();

      for (const [valueSortOrder, valueKey] of optionDefinition.values.entries()) {
        const value = await prisma.productOptionValue.upsert({
          where: {
            optionId_key: {
              optionId: option.id,
              key: valueKey,
            },
          },
          update: {
            label: valueKey,
            sortOrder: valueSortOrder,
          },
          create: {
            optionId: option.id,
            key: valueKey,
            label: valueKey,
            sortOrder: valueSortOrder,
          },
        });
        valueIds.set(valueKey, value.id);
      }

      for (const variantDefinition of definition.variants) {
        const variantId = variantIds.get(variantDefinition.sku);
        const optionValueKey =
          optionDefinition.key === 'color' ? variantDefinition.color : variantDefinition.size;
        if (!variantId || !optionValueKey) continue;
        const optionValueId = valueIds.get(optionValueKey);
        if (!optionValueId) continue;

        await prisma.productVariantOptionValue.upsert({
          where: {
            variantId_optionValueId: {
              variantId,
              optionValueId,
            },
          },
          update: {},
          create: { variantId, optionValueId },
        });
      }
    }

    for (const [key, value] of Object.entries(definition.attributes)) {
      await prisma.productAttribute.upsert({
        where: { productId_key: { productId: product.id, key } },
        update: { value },
        create: { productId: product.id, key, value },
      });
    }
  }

  await seedDemoContentAndSeo();
  await seedDemoCustomerAndOrders(productIdsBySlug, variantIdsBySku);

  console.log(`Seeded ${categories.length} categories and ${productDefinitions.length} products.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
