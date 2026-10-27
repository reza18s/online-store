# InventoryView — design handoff

- **شناسه:** `admin-catalog-catalog-inventory-inventory-view`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/catalog/components/catalog-inventory/inventory-view.tsx:36-282`](../../../apps/admin/src/features/catalog/components/catalog-inventory/inventory-view.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: تغییر موجودی ثبت شد و نسخه تازه بارگیری شد.، تغییر موجودی ثبت نشد.، نقطه سفارش مجدد باید عدد صحیح نامنفی باشد.، نقطه سفارش مجدد ذخیره شد.، نقطه سفارش مجدد ذخیره نشد.، در حال دریافت موجودی...، NOVA / INVENTORY، موجودی، نمای کلی موجودی محصولات و مدیریت انبار بر اساس داده‌های واقعی سرویس مدیریت.، محصول جدید، خلاصه موجودی، مجموع موجودی این صفحه.

رویدادهای JSX ثبت‌شده: QueryState / onRetry؛ form / onSubmit / برچسب ساختاری: جست‌وجو / جست‌وجوی محصول یا SKU... / وضعیت تنوع؛ FilterInput / onChange؛ UiSelect / onChange / برچسب ساختاری: فیلتر وضعیت تنوع / همه تنوع‌ها / فعال؛ Checkbox / onChange؛ InventoryRow / onSelect؛ Pagination / onPageChange؛ InventoryDetail / onAdjust, onReorder. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: filters، search، selectedVariantId، delta، reason، reorderPoint، error، success.

نشانگرهای state: error، success.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
