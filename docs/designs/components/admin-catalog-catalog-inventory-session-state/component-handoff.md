# AdminSessionState — design handoff

- **شناسه:** `admin-catalog-catalog-inventory-session-state`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/catalog/components/catalog-inventory/admin-session-state.tsx:7-51`](../../../apps/admin/src/features/catalog/components/catalog-inventory/admin-session-state.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: در حال بررسی نشست مدیریت، دسترسی عملیاتی از سرویس مدیریت بررسی می‌شود.، نشست مدیریت منقضی شده است، برای مشاهده کاتالوگ و موجودی دوباره وارد پنل شوید.، دسترسی مدیریت کافی نیست، نقش فعلی شما اجازه مشاهده این بخش عملیاتی را ندارد.، ورود به پنل مدیریت لازم است، برای مشاهده اطلاعات واقعی کاتالوگ و موجودی ابتدا وارد شوید.، ورود به پنل.

رویدادهای JSX ثبت‌شده: event مستقیمی در inventory ثبت نشده است. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: متغیری در inventory ثبت نشده است.

نشانگرهای state: loading.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
