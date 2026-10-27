# AboutContentPage — design handoff

- **شناسه:** `web-content-about-content-page`
- **محدوده:** `web`
- **منبع:** [`apps/web/src/features/content/components/about-content-page.tsx:18-220`](../../../apps/web/src/features/content/components/about-content-page.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: زیبایی، زمانی ماندگار است که واقعی باشد.، آشنایی با نوا، داستان نوا؛، فراتر از مد، برای شما.، نوا از باور به زیبایی آگاهانه متولد شد؛، با لباسی که تنها پوشیده نمی‌شود،، بلکه با شما زندگی می‌کند.، هویت نوا، ریشه در فرهنگ،، نگاهی به امروز،، و فردایی زیباتر.، TIMELESS.

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
