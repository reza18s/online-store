# ListingDiscovery — design handoff

- **شناسه:** `web-catalog-listing-discovery`
- **محدوده:** `web`
- **منبع:** [`apps/web/src/features/catalog/components/listing-discovery.tsx:50-792`](../../../apps/web/src/features/catalog/components/listing-discovery.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: تخفیف‌های منتخب، تازه‌های آتلیه، همه محصولات، فقط موجود، تخفیف ویژه، دسته‌بندی، سایز، رنگ، جنس پارچه، خانه، /، فروشگاه.

رویدادهای JSX ثبت‌شده: FilterSelect / onChange؛ ListingPriceFilter / onUpdate؛ FilterSelect / onChange؛ FilterSelect / onChange؛ FilterSelect / onChange؛ ListingStatusFilter / onSale, onInStockChange, onSaleChange؛ Button / onClick / برچسب ساختاری: فیلترها؛ UiSelect / onChange / برچسب ساختاری: جدیدترین / ارزان‌ترین / گران‌ترین. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: desktopFiltersOpen، desktopFilterRailMounted، mobileFiltersOpen، mobileFilterSheetMounted، mobileFiltersClosing، searchDraft، isMobileSearch.

نشانگرهای state: نشانگر متنی ثبت نشده است.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
