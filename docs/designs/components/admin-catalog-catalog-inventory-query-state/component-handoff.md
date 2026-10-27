# QueryState — design handoff

- **شناسه:** `admin-catalog-catalog-inventory-query-state`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/catalog/components/catalog-inventory/query-state.tsx:15-61`](../../../apps/admin/src/features/catalog/components/catalog-inventory/query-state.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: اتصال شبکه در دسترس نیست، دریافت اطلاعات انجام نشد، اتصال را بررسی کنید و دوباره تلاش کنید.، اطلاعات فعلاً در دسترس نیست.، تلاش دوباره، موردی پیدا نشد، فیلترها را تغییر دهید یا اولین مورد را از همین نما ثبت کنید..

رویدادهای JSX ثبت‌شده: Button / onClick / برچسب ساختاری: تلاش دوباره. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: متغیری در inventory ثبت نشده است.

نشانگرهای state: نشانگر متنی ثبت نشده است.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
