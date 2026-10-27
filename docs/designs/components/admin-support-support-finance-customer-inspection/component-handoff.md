# CustomerInspection — design handoff

- **شناسه:** `admin-support-support-finance-customer-inspection`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/support/components/support-finance/customer-inspection.tsx:37-254`](../../../apps/admin/src/features/support/components/support-finance/customer-inspection.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: مدیریت مشتریان، جست‌وجو، ایمیل، تلفن یا شناسه مشتری...، وضعیت، مشتری پیدا نشد، عبارت جست‌وجو یا وضعیت را تغییر دهید.، خلاصه مشتریان، کل مشتریان، فعال در این صفحه، دارای سفارش، غیرفعال در این صفحه، فهرست مشتریان.

رویدادهای JSX ثبت‌شده: FilterBar / onSubmit / برچسب ساختاری: جست‌وجو / ایمیل، تلفن یا شناسه مشتری... / وضعیت؛ TextFilter / onChange؛ SelectFilter / onChange؛ tr / onClick / برچسب ساختاری: بدون سفارش / مشاهده مشتری؛ button / onClick؛ button / onClick؛ Pagination / onPageChange؛ button / onClick / برچسب ساختاری: بستن جزئیات. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: draftQ، draftStatus، selectedCustomerId، filters.

نشانگرهای state: selected.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
