# ContentView — design handoff

- **شناسه:** `admin-content-content-seo-content-view`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/content/components/content-seo/content-view.tsx:26-154`](../../../apps/admin/src/features/content/components/content-seo/content-view.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: در حال بارگیری صفحه‌ها، فهرست محتوای مدیریت در حال دریافت است.، اتصال برقرار نیست، بارگیری صفحه‌ها انجام نشد، تلاش دوباره، جزئیات صفحه بارگیری نشد، جست‌وجو در عنوان و اسلاگ…، وضعیت، همه وضعیت‌ها، پیش‌نویس، منتشر شده، بایگانی شده.

رویدادهای JSX ثبت‌شده: Button / onClick / برچسب ساختاری: تلاش دوباره؛ Button / onClick / برچسب ساختاری: تلاش دوباره؛ SearchBar / onChange؛ Select / onChange / برچسب ساختاری: وضعیت / همه وضعیت‌ها / پیش‌نویس؛ Button / onClick / برچسب ساختاری: صفحه جدید؛ ContentList / onSelect, onCreate؛ ContentEditor / onCreated, onSaved. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: search، status، selectedId، isCreating، editorKey.

نشانگرهای state: loading، offline، error، empty.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
