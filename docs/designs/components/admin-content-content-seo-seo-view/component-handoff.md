# SeoView — design handoff

- **شناسه:** `admin-content-content-seo-seo-view`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/content/components/content-seo/seo-view.tsx:22-183`](../../../apps/admin/src/features/content/components/content-seo/seo-view.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: در حال بارگیری متادیتا، رکوردهای SEO در حال دریافت هستند.، بارگیری SEO انجام نشد، تلاش دوباره، جست‌وجوی صفحات...، فیلترهای سریع، همه، برگه‌ها، محصولات، دسته‌ها، افزودن دستی، متادیتای SEO خالی است.

رویدادهای JSX ثبت‌شده: Button / onClick / برچسب ساختاری: تلاش دوباره؛ SearchBar / onChange؛ Button / onClick / برچسب ساختاری: افزودن دستی؛ Button / onClick / برچسب ساختاری: رکورد جدید؛ button / onClick / برچسب ساختاری: صفحه اصلی / نیاز به بررسی / بهینه؛ button / onClick / برچسب ساختاری: صفحه اصلی / نیاز به بررسی / بهینه؛ SeoEditor / onSaved. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: search، selectedId، creating.

نشانگرهای state: loading، offline، error، empty، selected.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
