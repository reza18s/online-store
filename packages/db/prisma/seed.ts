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
  const enableLocalStaffFixture = localTestModeEnabled();
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
        publishedAt: new Date(),
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
        publishedAt: new Date(),
      },
    });

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
              .filter((value): value is string => Boolean(value)),
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
              .filter((value): value is string => Boolean(value)),
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
        const optionValueId = optionValueKey ? valueIds.get(optionValueKey) : undefined;
        if (!variantId || !optionValueId) continue;

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
