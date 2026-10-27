# CatalogView — design handoff

- **شناسه:** `admin-catalog-catalog-inventory-catalog-view`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/catalog/components/catalog-inventory/catalog-view.tsx:32-217`](../../../apps/admin/src/features/catalog/components/catalog-inventory/catalog-view.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: در حال دریافت محصولات...، CATALOG / PRODUCT CONTROL، محصولات، ایجاد، ویرایش، انتشار و اتصال محصول به طبقه‌بندی و تنوع‌ها.، محصول جدید، فقط مشاهده، جست‌وجو در محصولات، نام یا شناسه محصول...، وضعیت، فیلتر وضعیت محصول، همه وضعیت‌ها، پیش‌نویس.

رویدادهای JSX ثبت‌شده: QueryState / onRetry؛ form / onSubmit / برچسب ساختاری: جست‌وجو در محصولات / نام یا شناسه محصول... / وضعیت؛ FilterInput / onChange؛ UiSelect / onChange / برچسب ساختاری: فیلتر وضعیت محصول / همه وضعیت‌ها / پیش‌نویس؛ UiSelect / onChange / برچسب ساختاری: فیلتر دسته‌بندی / همه دسته‌ها؛ Pagination / onPageChange. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: filters، search.

نشانگرهای state: نشانگر متنی ثبت نشده است.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
