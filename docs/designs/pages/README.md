# برنامه‌ی طراحی صفحه‌های NOVA

**هدف:** طراحی مرجعِ همه‌ی مسیرهای صفحه‌ای فروشگاه و ادمین، با فایل‌های قابل بازبینی و بازتولید. دامنه‌ی این کار فقط طراحی است؛ کد اپ، API، منطق و انتشار تغییر نمی‌کنند.

**مبنای کار:** main در commit d15eb6c0b54dff3ed789983b6182c876d82cf0fd، مسیرهای واقعی در apps/web/src/app/routing/parse-route.ts و apps/admin/src/app/routes/AdminRouter.tsx، قراردادهای معماری arch.md و مشخصات docs/designs/atelier-editorial.md.

**جهت بصری:** برای صفحه‌های Atelier، بخش ۱۸ سند Atelier («Soft Modern»، آخرین بازبینی 2026-09-26) مرجع ظاهر است. صفحه‌های کارکنان در قاب مستقل Admin می‌مانند و فقط از primitiveهای مشترکِ مجاز استفاده می‌کنند. رفتار فروش، مجوزها، مسیرها، RTL، API و stateها از ظاهر جدا و محفوظ‌اند.

## ترتیب اجرا

1. ثبت پوشش مسیرها و مالک هر صفحه از روی Routerها؛ routeهای داینامیک به‌صورت template با نمونه‌های audience/state ثبت می‌شوند.
2. طراحی همه‌ی صفحه‌های عمومی، خرید، حساب و وضعیت‌های سیستم؛ routeهایی که فقط state متفاوت دارند در یک پکیج با frameهای جدا پوشش می‌گیرند.
3. طراحی همه‌ی صفحه‌ها و stateهای Admin، با مرزبندی نقش‌ها و داده‌ی محدودشده.
4. بازبینی پوشش breakpoint/state، مدل و schema، ارجاع assetها، متن فارسی/RTL و خروجی‌های render؛ موارد پیشنهادی و تأییدنشده صریح می‌مانند.
5. پس از تکمیل صفحه‌ها، از الگوهای مشترک و کنترل‌های چنداکشنی backlog کامپوننت استخراج می‌شود؛ طراحی برد کامپوننت مرحله‌ی بعد است.

## پوشش صفحه‌های فعلی

### فروشگاه و مشتری

| شناسه‌ی هدف | مسیرها / حالت‌ها | قالب طراحی |
| --- | --- | --- |
| web-home | / | خانه‌ی Atelier با سه مخاطب زنانه/مردانه/بچگانه و مسیرهای کشف کالا. |
| web-search-dialog | /search و /search?q=… | پوسته‌ی Home در پس‌زمینه با SearchDialog باز؛ query اولیه از `q` می‌آید و submit به `/products?q=…` می‌رود. |
| web-search-results | /products?q=… | نتایج جست‌وجو؛ پکیج mobile-search فقط مرجع قبلی است و خروجی‌های این مجموعه با مدل و توکن فعلی دوباره ساخته می‌شوند. |
| web-category | /category/:slug؛ مخاطب زنانه، مردانه، بچگانه و شناسه‌های دسته‌بندی | فرود دسته‌بندی با hero، زیر‌دسته و محتوای مرتبط. |
| web-listing | /products، /products/:mode، /products/:audience، queryهای فیلتر/مرتب‌سازی/صفحه‌بندی | فهرست کالا؛ حالت‌های audience، تازه‌ها، تخفیف، اکسسوری، فیلترشده، خالی و خطا. |
| web-product-detail | /product/:slug | جزئیات کالا، انتخاب variant، راهنمای سایز، گالری و اقدام خرید. |
| web-cart | /cart، /cart/empty، /cart/conflict | صفحه و drawer سبد؛ خالی، قیمت/موجودی تغییرکرده و خطا. |
| web-auth | /auth، /auth/request، /auth/verify | درخواست و تأیید کد، خطای شماره/کد، انقضا و محدودیت تلاش. |
| web-checkout | /checkout و /checkout/:step؛ address/shipping/payment | هر سه گام، خلاصه‌ی سفارش، اعتبارسنجی، روش ناموجود و خطای بازیابی. |
| web-payment-outcomes | /checkout/local-payment، /checkout/payment-pending، /checkout/payment-failed، /checkout/payment-recovery، /checkout/confirmation | پرداخت، بازگشت از درگاه، pending/failure/recovery و رسید موفق؛ هر outcome frame جدا. |
| web-account | /account، /account/:section؛ dashboard/profile/orders و بخش‌های تعریف‌شده در کد | داشبورد، پروفایل، نشست منقضی، بارگذاری/خطا و حالت خالی. |
| web-address-book | /account/addresses، /account/addresses/create، /account/addresses/edit/:id | فهرست، ساخت، ویرایش و تأیید حذف؛ بدون افزودن رفتار خارج از قرارداد فعلی. |
| web-order-detail | /order/:orderNumber و لینک‌های رهگیری | snapshot سفارش، پرداخت، ارسال و timeline با حالت‌های وضعیت. |
| web-returns | /return، /return/request، /return/status | درخواست مرجوعی و پیگیری آن؛ وضعیت‌ها و خطاهای فرم. |
| web-editorial | /campaign، /guide، /article، /lookbook، /about، /trust | قالب‌های مستقل کمپین، مقاله/راهنما، lookbook و معرفی/اعتماد؛ هر مسیر در ماتریس به frame مربوط وصل می‌شود. |
| web-service-pages | /size-guide، /care-guide، /shipping-policy، /returns-policy، /faq، /contact، /privacy، /terms، /support | راهنماها و سیاست‌ها، FAQ و تماس/پشتیبانی با ساختار مناسب هر محتوا. |
| web-published-content | /content/:slug | صفحه‌ی محتوای منتشرشده با طول‌های کوتاه/بلند و رسانه‌ی موجود. |
| web-system-states | /state/offline، /state/error، /state/maintenance و not-found | پیام و مسیر بازیابی برای هر حالت؛ با shell عمومی هماهنگ. |

### پنل مدیریت

| شناسه‌ی هدف | مسیرها / حالت‌ها | قالب طراحی |
| --- | --- | --- |
| admin-login | /admin/login و ?expired=1 | ورود، نشست منقضی، invalid/locked/rate-limited و حالت MFA فقط به‌اندازه‌ی قرارداد موجود. |
| admin-dashboard | /admin | شاخص‌ها و صف کار؛ بارگذاری/خطا/دسترسی نقش. |
| admin-catalog | /admin/catalog، /admin/catalog/products | فهرست کالا با جست‌وجو، فیلتر، وضعیت، variant و صفحه‌بندی. |
| admin-product-editor | /admin/catalog/products/new، /admin/catalog/products/:id | ساخت/ویرایش کالا، variant، رسانه، پیش‌نویس، خطا و ذخیره. |
| admin-categories | /admin/catalog/categories | درخت دسته‌بندی، جابه‌جایی/مرتب‌سازی و وضعیت. |
| admin-inventory | /admin/inventory، /admin/inventory/:variantId | فهرست، جزئیات variant، اصلاح موجودی و اختلاف. |
| admin-orders | /admin/orders | صف سفارش و فیلتر/تب‌های وضعیت. |
| admin-order-detail | /admin/orders/:orderNumber | snapshot، پرداخت، ارسال، timeline و یادداشت داخلی. |
| admin-payments | /admin/payments | تلاش‌ها، مرجع درگاه، webhook و mismatch با PII حداقلی. |
| admin-customers | /admin/customers | جست‌وجوی محدودشده و جزئیات مجاز طبق نقش؛ حالت خالی/عدم دسترسی. |
| admin-notifications | /admin/notifications | بازرسی اعلان و retry فقط مطابق قابلیت موجود. |
| admin-audit | /admin/audit | رویداد، actor، entity و جزئیات قبل/بعد با داده‌ی ساختگیِ برچسب‌خورده. |
| admin-content | /admin/content، /admin/content/pages/:id | فهرست و ویرایش محتوا، پیش‌نویس/انتشار و خطا؛ preview در ویرایشگر فعلی منبع ندارد. |
| admin-seo | /admin/content/seo | metadata و بررسی وضعیت محتوا. |
| admin-redirects | /admin/content/redirects | فهرست/ویرایش انتقال‌ها و اعتبارسنجی. |
| admin-access-and-unavailable | نشست درحال بررسی/منقضی، permission denied، و مسیرهای فعلیِ fallback مانند /admin/promotions و /admin/operations | خودِ صفحه‌ی حالت دسترسی/مسیر ناموجود؛ قابلیت کسب‌وکار جدید جعل نمی‌شود. |

## مرز پوشش و معیار پایان

- هر مسیر ثابت و dynamic که Routerهای فعلی پشتیبانی می‌کنند به یک شناسه‌ی هدف و frame یا variant مشخص وصل می‌شود. مسیرهای future-only در بخش جداگانه می‌مانند و به‌عنوان صفحه‌ی موجود معرفی نمی‌شوند.
- برای هر هدف، برد اصلی، clean reference در viewport واقعی، مدل machine-readable، render source و گزارش QA ساخته می‌شود؛ viewportهای لازم طبق مشخصات فعلی شامل desktop و mobile و برای مسیرهای کلیدی tablet و narrow-mobile هستند.
- صفحه‌ها از روی منبع فارسی و RTL، با حالت‌های مرتبط و actionهای واقعی طراحی می‌شوند. متن/تصویر ساختگی به‌عنوان نمونه مشخص می‌شود؛ asset نامشخص با UNKNOWN یا placeholder برچسب می‌خورد.
- صفحه‌ای «طراحی‌شده» شمرده می‌شود که مسیرهایش در matrix پوشش داشته باشند، خروجی‌های لازم موجود باشند، schema و ارجاعات بررسی شوند و QA هر viewport/state نتیجه‌ی صریح داشته باشد.
- هیچ تغییری در پیاده‌سازی frontend/admin، API، پیکربندی محصول یا منطق کسب‌وکار در این کار انجام نمی‌شود.

## وضعیت اجرا

- **پوشش Routeها:** از روی Routerهای جاری فروشگاه و ادمین ثبت و تطبیق شد؛ `/search` پنجره‌ی جست‌وجو را روی Home باز می‌کند و `/products?q=…` صفحه‌ی نتایج مستقل است. در مجموع ۳۶ گروه صفحه و ۱۰۷ قاب مسیر/حالت پوشش داده شده‌اند.
- **بردهای صفحه:** کامل؛ هر ۳۶ هدف دارای برد اصلی ۱۵۳۶×۱۰۲۴، clean reference دسکتاپ و موبایل، رندرهای تمام‌صفحه‌ی حالت‌ها و فایل‌های handoff هستند. تعداد خروجی‌های ثبت‌شده ۴۸۴ است.
- **اعتبارسنجی:** رندر ۱۰۷ قاب، پیوندهای معنایی target/frame/node و AJV Draft 2020-12 برای `design-spec.json` موفق‌اند. ۸/۸ asset دارای ابعاد و hash است؛ تصویر گمشده گزارش نشد. فونت Peyda/Vazirmatn در محیط رندر موجود نبود و Tahoma فقط برای capture استفاده شد؛ مجوز assetهای محلی همچنان `UNKNOWN` است.
- **بردهای کامپوننت:** پس از تکمیل صفحه‌ها، ۱۱ هدف چنداکشنی storefront/admin طراحی شد و در کنار ۴ بسته‌ی پیشین در [فهرست مرکزی کامپوننت‌ها](../components/README.md) آمده است؛ ۶۰ حالت رفتاری و ۱۲۰ قاب desktop/mobile در این مرحله رندر شدند.
