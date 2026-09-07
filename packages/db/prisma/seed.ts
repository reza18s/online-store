import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
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

  const categories = await Promise.all(
    [
      ['women', 'زنانه'],
      ['men', 'مردانه'],
      ['children', 'بچگانه'],
      ['accessories', 'اکسسوری'],
    ].map(([slug, name]) =>
      prisma.category.upsert({
        where: { slug },
        update: { name },
        create: { slug, name },
      }),
    ),
  );

  const product = await prisma.product.upsert({
    where: { slug: 'linen-overshirt' },
    update: {
      name: 'پیراهن رویی لینن',
      status: 'PUBLISHED',
      basePriceToman: 2_490_000,
      publishedAt: new Date(),
    },
    create: {
      slug: 'linen-overshirt',
      name: 'پیراهن رویی لینن',
      shortDescription: 'لایه‌ای سبک برای روزهای گرم و استایل روزمره.',
      description: 'پارچه لینن سبک با برش آزاد و دکمه‌های چوبی.',
      status: 'PUBLISHED',
      basePriceToman: 2_490_000,
      publishedAt: new Date(),
    },
  });

  for (const category of categories.slice(0, 2)) {
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

  const variant = await prisma.productVariant.upsert({
    where: { sku: 'NOVA-LINEN-001-M' },
    update: { productId: product.id, title: 'کرم / M', size: 'M', color: 'کرم', priceToman: 2_490_000 },
    create: {
      productId: product.id,
      sku: 'NOVA-LINEN-001-M',
      title: 'کرم / M',
      size: 'M',
      color: 'کرم',
      colorHex: '#d9c8ad',
      priceToman: 2_490_000,
    },
  });

  await prisma.inventoryItem.upsert({
    where: { variantId: variant.id },
    update: { onHand: 24, reorderPoint: 4 },
    create: { variantId: variant.id, onHand: 24, reorderPoint: 4 },
  });

  await prisma.productAttribute.upsert({
    where: { productId_key: { productId: product.id, key: 'material' } },
    update: { value: 'لینن' },
    create: { productId: product.id, key: 'material', value: 'لینن' },
  });

  console.log(`Seeded ${categories.length} categories and product ${product.slug}.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
