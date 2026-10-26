# فهرست بردهای مرجع کامپوننت‌های NOVA

**آخرین بازبینی:** 2026-10-26

**مبنای موجودی:** `main` در snapshot `0bb8c4d`

این فهرست چهار پکیج برد طراحی ثبت‌شده در همین پوشه را نگه می‌دارد. «برد آماده» یعنی برد اصلی، مرجع‌های تمیز، مدل طراحی و شواهد QA در پکیج وجود دارند؛ این عبارت به معنی تکمیل پیاده‌سازی محصول نیست.

## بردهای موجود

| کامپوننت / هدف | محدوده‌ی برد | وضعیت برد و QA | پکیج و شواهد |
| --- | --- | --- | --- |
| `admin-navigation-sidebar` | ریل ادمین دسکتاپ، ریل فشرده‌ی تبلت، drawer موبایل با لینک‌های وابسته به نقش | **برد آماده؛ یک شکاف بسته‌بندی دارد.** Schema و scene graph برابر PASS هستند؛ ماتریس پوشش 6 مورد VERIFIED دارد و QA runtime خطای صفحه گزارش نمی‌کند. گزارش روی shell خنثی و مسیر در دسترس اجرا شده است. `manifest.json` و handoff مستقل ندارد؛ README و implementation plan موجودند. | [README](admin-navigation-sidebar/README.md) · [پلن اجرا](admin-navigation-sidebar/implementation-plan.md) · [برد](admin-navigation-sidebar/renders/01-Visual-Design-Board.png) · [QA](admin-navigation-sidebar/renders/qa-report.json) |
| `catalog-filter-select` | گونه‌های فیلتر فهرست، اندازه و swatch؛ همراه با یادداشت ادغام در صفحه‌ی دسته‌بندی | **برد و پکیج آماده با هشدار.** QA برابر `PASS_WITH_WARNINGS` است. اعتبارسنج استاندارد JSON Schema، داده‌ی زنده‌ی کاتالوگ و بارگذاری فونت Vazirmatn تأیید نشده‌اند؛ تست‌های تغییرمحدوده اجرا نشده‌اند. | [handoff](catalog-filter-select/component-handoff.md) · [برد](catalog-filter-select/01-Visual-Design-Board.png) · [QA](catalog-filter-select/qa-report.json) |
| `catalog-filter-sidebar-gsap` | ریل فیلتر دسکتاپ و dialog فیلتر موبایل با چرخه‌ی باز/بسته و reduced motion | **برد و پکیج آماده؛ اعتبارسنجی طراحی و runtime ثبت شده است.** Schema، semantic checks، اندازه‌ی تصویر، اندازه‌گیری مرورگر و بازبینی بصری PASS هستند؛ typecheck و lint PASS و build دارای هشدار است. تست‌ها در محدوده‌ی آن تغییر اجرا نشده‌اند و داده‌ی زنده‌ی API کاتالوگ در runtime در دسترس نبوده است. | [handoff](catalog-filter-sidebar-gsap/component-handoff.md) · [برد](catalog-filter-sidebar-gsap/01-Visual-Design-Board.png) · [QA](catalog-filter-sidebar-gsap/qa-report.json) · [بازبینی runtime](catalog-filter-sidebar-gsap/runtime-review.json) |
| `category-sort-select` | select بومی مرتب‌سازی در toolbar صفحه‌ی دسته‌بندی؛ حالت باز دسکتاپ و موبایل | **برد و پکیج آماده با محدودیت‌های ثبت‌شده.** QA برابر `PASS_WITH_LIMITATIONS` است؛ هر چهار مقدار sort، query، hover و نمایش زنده بررسی شده‌اند. سازگاری popup در مرورگرهای قدیمی تأیید نشده؛ API کاتالوگ در بررسی runtime در دسترس نبوده و build هشدارهای Vite دارد. | [handoff](category-sort-select/component-handoff.md) · [برد](category-sort-select/01-Visual-Design-Board.png) · [QA](category-sort-select/qa-report.json) |

## محدوده و خواندن وضعیت

- تعداد **4** فقط تعداد پکیج‌های برد موجود زیر `docs/designs/components` است؛ این فایل فهرست کامل همه‌ی componentهای source code پروژه نیست.
- `catalog-filter-select`، `catalog-filter-sidebar-gsap` و `category-sort-select` هدف‌های جدا هستند: به‌ترتیب کنترل گزینه‌های facet، ریل/dialog فیلتر، و کنترل مرتب‌سازی.
- محدودیت‌های `UNVERIFIED` و هشدارهای QA عمداً حفظ شده‌اند؛ وجود برد به‌تنهایی آن‌ها را PASS نمی‌کند.
- وضعیت این صفحه درباره‌ی **مستند طراحی** است. برای وضعیت پیاده‌سازی، گزارش QA و پلن همان پکیج را ببینید.
- فهرست از فایل‌ها و QA ثبت‌شده در پکیج‌ها استخراج شده است؛ جایی که منشأ اجرای skill صریحاً در metadata ثبت نشده، این صفحه ادعای منشأ فراتر از شواهد پکیج نمی‌کند.

## قاعده‌ی افزودن بردهای بعدی

برای هر هدف جدید، ردیف جدا با `componentId` پایدار، محدوده‌ی هدف، لینک پکیج و وضعیت QA اضافه کن. برد را آماده ثبت کن وقتی خروجی‌های مربوطه واقعاً موجودند: `01-Visual-Design-Board.png`، مرجع تمیز متناسب با breakpointها، مدل و schema، source/authority/coverage، و QA گزارش‌شده. هشدارها، بخش‌های `UNVERIFIED` و شکاف manifest یا handoff را در همان ردیف بنویس و تکمیل طراحی را از تکمیل کد محصول جدا نگه دار.
