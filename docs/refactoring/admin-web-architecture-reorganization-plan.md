# برنامه بازآرایی ساختار Admin و Web

وضعیت: تکمیل شد
تاریخ: 2026-09-20

## هدف

بازآرایی واقعی دو اپلیکیشن `apps/admin` و `apps/web` بر اساس مالکیت feature، مرزبندی روشن بین routing/app shell، UI مشترک، منطق feature و API، بدون تغییر قراردادهای API، مسیرهای URL، مجوزها، رفتار RTL، SSR یا تجربه فعلی کاربر.

## یافته‌های قطعی از ساختار فعلی

- هر دو اپلیکیشن هنوز `components`، `pages`، `hooks`، `lib` و `utils` را به‌عنوان پوشه‌های عمومی در سطح اپ دارند.
- بخش Admin تعداد زیادی فایل را در `components/admin/*-page-functions` نگه می‌دارد؛ این نام‌گذاری هم ownership را مبهم می‌کند و هم component، state و utility را کنار هم مخلوط می‌کند.
- بخش Web نیز `components/<feature>/*-page-functions` و `lib/<feature>/*-api-functions` دارد؛ feature وجود دارد اما به‌صورت پراکنده و بدون یک مرز قابل تشخیص مصرف می‌شود.
- ورودی و routing در Admin داخل componentهای feature (`admin-app` و `admin-page`) قرار گرفته است.
- در Web، app shell داخل `components/app` و feature pageها داخل `pages` و componentها داخل `components` تقسیم شده‌اند، اما یک feature واحد در چند ریشه پخش شده است.
- نام فایل‌های فعلی عمدتاً kebab-case است، ولی برخی فایل‌های pure utility با پسوند `.tsx` و برخی نام‌های طولانی/تکراری ownership واقعی را پنهان می‌کنند.

## ساختار هدف

### Admin

```text
apps/admin/src/
  app/
    AdminApp.tsx
    routes/
      AdminRouter.tsx
    layouts/
      AdminWorkspaceLayout.tsx
    providers/
    entry.tsx
  features/
    auth/
    dashboard/
    catalog/              # catalog + inventory ownership
    orders/
    content/
    support/
  shared/
    components/
    fixtures/
    ui/
    utils/
  styles.css
```

هر feature، componentهای خودش، query/mutationهای خودش، type/schema و utilityهای domain خودش را نگه می‌دارد. فقط primitiveهای UI و componentهای واقعاً مشترک در `shared` قرار می‌گیرند.

### Web

```text
apps/web/src/
  app/
    App.tsx
    routes/
    providers/
    ssr/
    entry.tsx
  features/
    auth/
    catalog/
    cart/
    checkout/
    account/
    orders/
    content/
    seo/
  shared/
    analytics/
    fixtures/
    ui/
    utils/
  styles.css
```

صفحه‌های route-level در همان feature می‌مانند؛ page فقط orchestration می‌کند و renderingهای مستقل در `components` همان feature قرار می‌گیرند. API و state feature هم کنار همان feature قرار می‌گیرد.

## قواعد نام‌گذاری

- route-level pageها و componentهای اصلی: `PascalCase.tsx`، مانند `ProductTable.tsx` و `CheckoutPage.tsx`؛ utilityهای کوچک داخل feature با نام دقیق kebab-case باقی می‌مانند.
- hookها: `use<Name>.ts`.
- API و utilityهای تک‌مسئولیتی: `kebab-case.ts` با نام دقیق رفتار، مانند `products-api.ts` و `format-toman.ts`.
- schema/type: `<domain>.schema.ts` و `<domain>.types.ts`.
- از نام‌های `*-page-functions`، `*-api-functions`، `helper.ts` و `common.ts` برای مالکیت‌های مبهم استفاده نمی‌شود.
- import عمومی بین featureها فقط از public entrypoint همان feature انجام می‌شود؛ import به فایل داخلی feature دیگر مجاز نیست.

## ترتیب اجرا

1. ساختار هدف و نقشه انتقال را در همین فایل ثبت کردم.
2. app shell و entry pointهای Admin و Web از componentهای عمومی جدا شدند.
3. featureها، pageها و componentهای مربوط به مالک واقعی خود منتقل شدند.
4. API/stateهای هر feature کنار همان feature قرار گرفتند و exportهای عمومی ایجاد شدند.
5. primitiveها و componentهای واقعاً مشترک در `shared` باقی ماندند؛ business logic وارد `shared/ui` نشد.
6. importها، تست‌ها، aliasها و build entrypointها به مسیرهای جدید وصل شدند.
7. نام فایل‌های route-level و componentهای اصلی یکدست شدند و نام‌گذاری مبهم `*-page-functions` و `*-api-functions` حذف شد.
8. typecheck، تست‌های نزدیک، build، lint هدفمند، تست کامل workspace و diff نهایی بررسی شدند.

## محدوده و عدم تغییر

- `packages/api-client`، backend، database و worker فقط در صورت شکست یک contract مصرف‌کننده تغییر می‌کنند.
- قرارداد API، مسیرهای public/admin، احراز هویت، authorization، query keyها، SSR و رفتار responsive/RTL تغییر نمی‌کنند.
- refactor صرفاً برای زیبایی یا تغییر فناوری انجام نمی‌شود؛ هر انتقال باید ownership یا خوانایی/قابلیت تست را بهتر کند.

## معیار تکمیل

- ساختار جدید درخت ownership روشن برای Admin و Web دارد.
- هیچ importی به مسیرهای حذف‌شده یا `*-page-functions` باقی نمانده است.
- app shell، route-level pageها، feature logic و shared primitives مسئولیت‌های جدا دارند.
- typecheck، تست‌های مرتبط و build هر دو اپلیکیشن موفق هستند.
- فایل‌های تغییریافته فقط شامل موارد لازم برای این بازآرایی هستند.

## گزارش اجرا

- [x] app shell و entrypointها
- [x] Admin feature slices
- [x] Web feature slices
- [x] API/state ownership و public exports
- [x] یکدست‌سازی نام فایل‌ها
- [x] validation نهایی

## نتیجه و شواهد validation

- `bun run typecheck` موفق شد.
- `bun test apps/admin/src apps/web/src`: تعداد ۲۰۴ تست موفق، بدون خطا.
- `bun run test`: تعداد ۴۸۹ تست موفق، ۱ تست skip‌شده و بدون خطا.
- `bunx eslint apps/admin/src apps/web/src apps/admin/vite.config.ts apps/web/vite.config.ts --max-warnings=0` موفق شد.
- build وب شامل client و SSR موفق شد؛ build ادمین نیز موفق شد.
- `git diff --check` بدون خطای whitespace موفق شد.
- یک اصلاح ضروری در fixture تست SSR انجام شد: مسیر `apps/web/src/app/ssr/server.test.ts` بعد از انتقال فایل به `../../../public` تنظیم شد.

## پیگیری: حذف Hash Route از Web Demo

وضعیت: تکمیل شد

هدف این batch، استفاده‌ی مستقیم و کامل از routeهای clean در `App`، `PublicApp`، SEO، SSR و تمام لینک‌های داخلی Web است تا Demo هیچ مسیر `#...` تولید نکند.

1. تبدیل قرارداد داخلی route از `HashRoute`/`parseHashRoute` به routeهای clean و نام‌گذاری خنثی.
2. انتقال navigationهای داخل Web از `window.location.hash` به history/browser route.
3. حذف adapterها و فایل‌های route قدیمی که فقط برای hash استفاده می‌شدند.
4. به‌روزرسانی SEO، SSR handoff، تست route و تست‌های UI بدون تغییر قرارداد API یا مسیرهای clean.
5. اجرای typecheck، تست کامل Web، lint، build client/SSR و مرور referenceهای hash در Web.

### شواهد اجرای پیگیری

- قرارداد داخلی `App`، `PublicApp`، SEO و SSR اکنون فقط از مسیرهای clean استفاده می‌کند.
- navigationهای لینک‌ها، جست‌وجو، auth، checkout، account و catalog با history/browser route انجام می‌شوند؛ `window.location.hash` و فایل‌های route قدیمی Web حذف شدند.
- تست Web: `116 pass`.
- Web typecheck، lint، build client و build SSR موفق شدند.
- smoke test مرورگر روی مسیرهای اصلی و click داخلی، بدون وجود `#` در URL، موفق شد.
- API محلی در زمان smoke test روی `127.0.0.1:4000` اجرا نبود؛ پاسخ‌های 500 فقط مربوط به proxy درخواست‌های `/v1/*` بودند و خطای JavaScript یا routing مشاهده نشد.

## پیگیری: حذف Legacy Runtime از Admin

وضعیت: تکمیل شد

هدف این batch، حذف مسیرهای hash و fallbackهای Demo قدیمی از Admin و انتقال تمام navigationهای Admin به مسیرهای clean زیر `/admin/...` است.

1. حذف `AdminLegacyPage`، شاخه‌ی fallback قدیمی و داشبورد preview با داده‌ی ساختگی از Admin.
2. تبدیل `AdminApp` و navigation داخلی Admin از `window.location.hash` به pathname/history.
3. rename کردن decoder گمراه‌کننده‌ی `hash-route.ts` به قرارداد خنثی و اضافه‌کردن navigation bridge محدود به `/admin`.
4. تبدیل لینک‌های Admin، auth، catalog، orders، content، dashboard و تست‌های E2E به مسیرهای clean.
5. حذف product-list قدیمی، fixtureهای fake storefront و API عمومی content بدون مصرف از Admin.
6. اجرای validation نهایی برای typecheck، تست، lint، E2E typecheck و build.

### شواهد اجرای پیگیری

- `AdminLegacyPage`، `AdminProductsPage`، product-list قدیمی، داشبورد DEV preview و زنجیره‌ی fixtureهای fake storefront از Admin حذف شدند؛ `/admin` فقط پس از staff session معتبر به `DashboardView` API-backed می‌رسد.
- `AdminApp` فقط `popstate` و pathname را مصرف می‌کند؛ `hashchange`، `window.location.hash` و route moduleهای hash در Admin/Web باقی نمانده‌اند.
- لینک‌ها و helperهای تست E2E به مسیرهای clean منتقل شدند؛ `bun run typecheck:test` موفق شد.
- Admin typecheck موفق شد؛ تست‌های Admin: `80 pass`؛ تست‌های Web: `116 pass`.
- `bunx eslint apps/admin/src apps/web/src --max-warnings=0` موفق شد.
- build production Admin موفق شد؛ build client/SSR Web در پیگیری قبلی موفق شده بود.
- `git diff --check` بدون خطای whitespace موفق شد.
- اجرای مستقیم تست‌ها از cwd هر اپ معیار معتبر است؛ اجرای خام `bun test` از ریشه به‌دلیل resolve نکردن aliasهای `@/*` در Bun، تست‌های source را load نکرد و به‌عنوان محدودیت ابزار ثبت شد.
