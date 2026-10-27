# PublishedContent — design handoff

- **شناسه:** `web-content-published-content`
- **محدوده:** `web`
- **منبع:** [`apps/web/src/features/content/components/published-content.tsx:24-125`](../../../apps/web/src/features/content/components/published-content.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: محتوای نوا، مسیر صفحه، خانه، /، NOVA / CONTENT، یادداشت‌ها، راهنماها و روایت‌های منتشرشده از آتلیه نوا.، محتوای منتشرشده، این صفحه منتشر شده است، اما هنوز محتوای قابل نمایش ندارد.، بخشی از این صفحه در حال حاضر برای نمایش ایمن پشتیبانی نمی‌شود. برای ادامه، از خانه شروع کنید.، بازگشت به خانه، راهنمای مطالعه، NOVA / JOURNAL.

رویدادهای JSX ثبت‌شده: event مستقیمی در inventory ثبت نشده است. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: متغیری در inventory ثبت نشده است.

نشانگرهای state: empty.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
