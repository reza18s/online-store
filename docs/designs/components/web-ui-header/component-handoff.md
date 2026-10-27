# Header — design handoff

- **شناسه:** `web-ui-header`
- **محدوده:** `web`
- **منبع:** [`apps/web/src/shared/ui/header.tsx:11-239`](../../../apps/web/src/shared/ui/header.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: جست‌وجوی محصولات، باز کردن منو، ورود یا حساب کاربری، ورود / حساب، بستن جست‌وجو، جست‌وجوی محصولات، برندها و ...، جست‌وجو، دسته‌بندی‌های اصلی، علاقه‌مندی‌ها.

رویدادهای JSX ثبت‌شده: Button / onClick / برچسب ساختاری: جست‌وجوی محصولات؛ Button / onClick / برچسب ساختاری: باز کردن منو؛ Button / onClick / برچسب ساختاری: باز کردن منو؛ form / onSubmit, onKeyDown / برچسب ساختاری: بستن جست‌وجو / جست‌وجوی محصولات، برندها و ... / جست‌وجو؛ Button / onClick / برچسب ساختاری: بستن جست‌وجو؛ input / onChange. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: isCompact، isSearchOpen، searchTerm.

نشانگرهای state: نشانگر متنی ثبت نشده است.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
