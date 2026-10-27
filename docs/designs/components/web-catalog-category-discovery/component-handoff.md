# CategoryDiscovery — design handoff

- **شناسه:** `web-catalog-category-discovery`
- **محدوده:** `web`
- **منبع:** [`apps/web/src/features/catalog/components/category-discovery.tsx:75-328`](../../../apps/web/src/features/catalog/components/category-discovery.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: پارچه‌های آتلیه نوا، دسته‌بندی، سایز، رنگ، جنس، فقط موجود، پیشنهاد ویژه، پاک‌کردن فیلترها، خانه، /، پوشاک راحت برای روزهای پرماجرای کودک، در حال دریافت محصولات….

رویدادهای JSX ثبت‌شده: FilterSelect / onChange؛ FilterSelect / onChange؛ FilterSelect / onChange؛ FilterSelect / onChange؛ Checkbox / onChange؛ Checkbox / onChange؛ Button / onClick / برچسب ساختاری: فیلترها؛ UiSelect / onChange / برچسب ساختاری: مرتب‌سازی محصولات. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: mobileFiltersOpen.

نشانگرهای state: نشانگر متنی ثبت نشده است.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
