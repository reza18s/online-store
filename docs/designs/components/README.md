# فهرست بردهای مرجع کامپوننت‌های NOVA

**آخرین بازبینی:** 2026-10-26

**مبنای کد و منابع:** `main` در commit `d15eb6c`؛ snapshot طراحی `2026-10-26`

این فهرست مرجع مرکزی ۱۵ پکیج برد طراحی ثبت‌شده در همین پوشه است: ۴ برد قبلی و ۱۱ برد storefront/admin که پس از تکمیل نقشه‌ی همه‌ی صفحه‌ها ساخته شدند. «برد آماده» یعنی board، clean referenceها، مدل طراحی، منبع‌ها و QA در پکیج موجودند؛ این عبارت به معنی تکمیل پیاده‌سازی محصول نیست.

## بردهای موجود

| کامپوننت / هدف | محدوده‌ی برد | وضعیت برد و QA | پکیج و شواهد |
| --- | --- | --- | --- |
| `admin-navigation-sidebar` | ریل ادمین دسکتاپ، ریل فشرده‌ی تبلت، drawer موبایل با لینک‌های وابسته به نقش | **برد آماده؛ یک شکاف بسته‌بندی دارد.** Schema و scene graph برابر PASS هستند؛ ماتریس پوشش 6 مورد VERIFIED دارد و QA runtime خطای صفحه گزارش نمی‌کند. گزارش روی shell خنثی و مسیر در دسترس اجرا شده است. `manifest.json` و handoff مستقل ندارد؛ README و implementation plan موجودند. | [README](admin-navigation-sidebar/README.md) · [پلن اجرا](admin-navigation-sidebar/implementation-plan.md) · [برد](admin-navigation-sidebar/renders/01-Visual-Design-Board.png) · [QA](admin-navigation-sidebar/renders/qa-report.json) |
| `catalog-filter-select` | گونه‌های فیلتر فهرست، اندازه و swatch؛ همراه با یادداشت ادغام در صفحه‌ی دسته‌بندی | **برد و پکیج آماده با هشدار.** QA برابر `PASS_WITH_WARNINGS` است. اعتبارسنج استاندارد JSON Schema، داده‌ی زنده‌ی کاتالوگ و بارگذاری فونت Vazirmatn تأیید نشده‌اند؛ تست‌های تغییرمحدوده اجرا نشده‌اند. | [handoff](catalog-filter-select/component-handoff.md) · [برد](catalog-filter-select/01-Visual-Design-Board.png) · [QA](catalog-filter-select/qa-report.json) |
| `catalog-filter-sidebar-gsap` | ریل فیلتر دسکتاپ و dialog فیلتر موبایل با چرخه‌ی باز/بسته و reduced motion | **برد و پکیج آماده؛ اعتبارسنجی طراحی و runtime ثبت شده است.** Schema، semantic checks، اندازه‌ی تصویر، اندازه‌گیری مرورگر و بازبینی بصری PASS هستند؛ typecheck و lint PASS و build دارای هشدار است. تست‌ها در محدوده‌ی آن تغییر اجرا نشده‌اند و داده‌ی زنده‌ی API کاتالوگ در runtime در دسترس نبوده است. | [handoff](catalog-filter-sidebar-gsap/component-handoff.md) · [برد](catalog-filter-sidebar-gsap/01-Visual-Design-Board.png) · [QA](catalog-filter-sidebar-gsap/qa-report.json) · [بازبینی runtime](catalog-filter-sidebar-gsap/runtime-review.json) |
| `category-sort-select` | select بومی مرتب‌سازی در toolbar صفحه‌ی دسته‌بندی؛ حالت باز دسکتاپ و موبایل | **برد و پکیج آماده با محدودیت‌های ثبت‌شده.** QA برابر `PASS_WITH_LIMITATIONS` است؛ هر چهار مقدار sort، query، hover و نمایش زنده بررسی شده‌اند. سازگاری popup در مرورگرهای قدیمی تأیید نشده؛ API کاتالوگ در بررسی runtime در دسترس نبوده و build هشدارهای Vite دارد. | [handoff](category-sort-select/component-handoff.md) · [برد](category-sort-select/01-Visual-Design-Board.png) · [QA](category-sort-select/qa-report.json) |

## محدوده و خواندن وضعیت

- تعداد **15** تعداد پکیج‌های برد طراحی موجود زیر `docs/designs/components` است؛ این فایل فهرست همه‌ی componentهای source code پروژه نیست. ۱۱ هدف جدید این مرحله، کامپوننت‌های چنداکشنی یا پرتکرارند.
- `catalog-filter-select`، `catalog-filter-sidebar-gsap` و `category-sort-select` هدف‌های جدا هستند: به‌ترتیب کنترل گزینه‌های facet، ریل/dialog فیلتر، و کنترل مرتب‌سازی.
- محدودیت‌های `UNVERIFIED` و هشدارهای QA عمداً حفظ شده‌اند؛ وجود برد به‌تنهایی آن‌ها را PASS نمی‌کند.
- وضعیت این صفحه درباره‌ی **مستند طراحی** است. برای وضعیت پیاده‌سازی، گزارش QA و پلن همان پکیج را ببینید.
- فهرست از فایل‌ها و QA ثبت‌شده در پکیج‌ها استخراج شده است؛ جایی که منشأ اجرای skill صریحاً در metadata ثبت نشده، این صفحه ادعای منشأ فراتر از شواهد پکیج نمی‌کند.

## قاعده‌ی افزودن بردهای بعدی

برای هر هدف جدید، ردیف جدا با `componentId` پایدار، محدوده‌ی هدف، لینک پکیج و وضعیت QA اضافه کن. برد را آماده ثبت کن وقتی خروجی‌های مربوطه واقعاً موجودند: `01-Visual-Design-Board.png`، مرجع تمیز متناسب با breakpointها، مدل و schema، source/authority/coverage، و QA گزارش‌شده. هشدارها، بخش‌های `UNVERIFIED` و شکاف manifest یا handoff را در همان ردیف بنویس و تکمیل طراحی را از تکمیل کد محصول جدا نگه دار.

## روند ادامه‌ی طراحی

برای هدف‌های بعدی، ابتدا مالک UI، actionها و stateهای واقعی را از منبع استخراج کن و از skill `$create-design-reference-board` پیروی کن؛ سپس برد را به همین فهرست مرکزی اضافه کن. renderer تکرارپذیر این ۱۱ پکیج در [render-source](render-source/generate-component-boards.mjs) است: با شناسه‌ی یک هدف، همان بسته را رندر می‌کند؛ بدون شناسه همه‌ی ۱۱ هدف این مرحله را بازتولید می‌کند. اضافه‌کردن یک هدف تازه نیازمند تعریف منبع، stateها و QA آن در renderer است و خودبه‌خود از فهرست componentهای کد استخراج نمی‌شود.

## کامپوننت‌های تکمیل‌شده پس از صفحه‌ها

این ۱۱ هدف از ۳۶ گروه صفحه و مالکان واقعی UI استخراج شده‌اند. انتخاب بر اساس استفاده‌ی چندصفحه‌ای یا چرخه‌ی چنداکشنی/چندحالته است؛ کنترل‌های ساده‌ی تک‌عملیاتی در قالب برد مستقل کپی نمی‌شوند. تمام ردیف‌های زیر **برد و handoff طراحی** دارند؛ هیچ‌کدام ادعای پیاده‌سازی تازه در کد ندارند.

| `componentId` | مالک منبع | اکشن‌ها و حالت‌های طراحی‌شده | وضعیت و مدارک |
| --- | --- | --- | --- |
| `web-search-dialog` | `apps/web/src/shared/ui/search-dialog.tsx` | جست‌وجو، پاک‌کردن، انتخاب پیشنهاد/نمایش نتایج؛ خالی، loading، بی‌نتیجه و خطا. | **آماده با هشدار** · [handoff](web-search-dialog/component-handoff.md) · [برد](web-search-dialog/01-Visual-Design-Board.png) · [QA](web-search-dialog/qa-report.json) |
| `web-product-card` | `apps/web/src/features/catalog/components/product-card.tsx` | مشاهده، علاقه‌مندی و افزودن به سبد؛ موجود، کم‌موجود، ناموجود. | **آماده با هشدار** · [handoff](web-product-card/component-handoff.md) · [برد](web-product-card/01-Visual-Design-Board.png) · [QA](web-product-card/qa-report.json) |
| `web-product-variant-picker` | `apps/web/src/features/catalog/components/product-discovery.tsx` | انتخاب ویژگی/اندازه و افزودن؛ انتخاب ناقص، موجود/ناموجود، pending و success. | **آماده با هشدار** · [handoff](web-product-variant-picker/component-handoff.md) · [برد](web-product-variant-picker/01-Visual-Design-Board.png) · [QA](web-product-variant-picker/qa-report.json) |
| `web-cart-line-item` | `apps/web/src/features/cart/components/CartView.tsx` و اجزای تعارض | کم/زیادکردن تعداد، حذف و رفع تعارض ادغام؛ حداقل، pending و ناموجود. | **آماده با هشدار** · [handoff](web-cart-line-item/component-handoff.md) · [برد](web-cart-line-item/01-Visual-Design-Board.png) · [QA](web-cart-line-item/qa-report.json) |
| `web-auth-otp-entry` | `apps/web/src/features/auth/components/auth-page.tsx` | درخواست/تأیید/ارسال دوباره‌ی OTP؛ شماره، کد، خطا و loading. شمارش معکوس تازه اضافه نشده است. | **آماده با هشدار** · [handoff](web-auth-otp-entry/component-handoff.md) · [برد](web-auth-otp-entry/01-Visual-Design-Board.png) · [QA](web-auth-otp-entry/qa-report.json) |
| `web-address-book` | `apps/web/src/features/account/components/customer-address-form.tsx` | افزودن/ویرایش/پیش‌فرض/ذخیره/حذف؛ validation، saving و تأیید بومی مرورگر. | **آماده با هشدار** · [handoff](web-address-book/component-handoff.md) · [برد](web-address-book/01-Visual-Design-Board.png) · [QA](web-address-book/qa-report.json) |
| `admin-order-action-panel` | `apps/admin/src/features/orders/components/order-management/OrderDetailView.tsx` | تغییر وضعیت، ثبت ارسال و بررسی مرجوعی؛ فرم، خطا، pending و موفقیت. | **آماده با هشدار** · [handoff](admin-order-action-panel/component-handoff.md) · [برد](admin-order-action-panel/01-Visual-Design-Board.png) · [QA](admin-order-action-panel/qa-report.json) |
| `admin-product-variant-panel` | `apps/admin/src/features/catalog/components/catalog-inventory/variants-panel.tsx` | افزودن و ویرایش تنوع؛ فهرست/خالی، SKU نامعتبر، loading، خطا و read-only. | **آماده با هشدار** · [handoff](admin-product-variant-panel/component-handoff.md) · [برد](admin-product-variant-panel/01-Visual-Design-Board.png) · [QA](admin-product-variant-panel/qa-report.json) |
| `admin-content-publishing-editor` | `apps/admin/src/features/content/components/content-seo/content-editor.tsx` | ویرایش، ذخیره‌ی پیش‌نویس و انتشار؛ dirty، آمادگی انتشار، خطا و pending. preview در منبع نیست. | **آماده با هشدار** · [handoff](admin-content-publishing-editor/component-handoff.md) · [برد](admin-content-publishing-editor/01-Visual-Design-Board.png) · [QA](admin-content-publishing-editor/qa-report.json) |
| `admin-seo-metadata-editor` | `apps/admin/src/features/content/components/content-seo/seo-editor.tsx` | ساخت/ویرایش/ذخیره/حذف Metadata؛ validation و تأیید بومی. preview جست‌وجو در منبع نیست. | **آماده با هشدار** · [handoff](admin-seo-metadata-editor/component-handoff.md) · [برد](admin-seo-metadata-editor/01-Visual-Design-Board.png) · [QA](admin-seo-metadata-editor/qa-report.json) |
| `admin-redirect-editor` | `apps/admin/src/features/content/components/content-seo/redirect-editor.tsx` | ایجاد/ویرایش/حذف، انتخاب 301/302؛ اعتبارسنجی مسیر داخلی و چرخه. action آزمایش مقصد در منبع نیست. | **آماده با هشدار** · [handoff](admin-redirect-editor/component-handoff.md) · [برد](admin-redirect-editor/01-Visual-Design-Board.png) · [QA](admin-redirect-editor/qa-report.json) |

این ۱۱ پکیج در مجموع ۶۰ حالت رفتاری و ۱۲۰ قاب desktop/mobile دارند. همه‌ی schemaها و scene graphها معتبرند؛ وضعیت QA هر برد `PASS_WITH_WARNINGS` است چون اجرای تعاملی کامپوننت واقعی انجام نشده و فونت‌های Peyda/Vazirmatn موجود نبودند. مجوز asset تصویری کارت کالا و ردیف سبد `UNKNOWN` مانده است. بردهای storefront از Soft Modern استفاده می‌کنند؛ بردهای staff shell/palette مستقل ادمین را حفظ می‌کنند. Tahoma فقط fallback تصویرسازی است.
