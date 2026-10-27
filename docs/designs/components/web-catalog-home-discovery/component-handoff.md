# HomeDiscovery — design handoff

- **شناسه:** `web-catalog-home-discovery`
- **محدوده:** `web`
- **منبع:** [`apps/web/src/features/catalog/components/home-discovery.tsx:18-648`](../../../apps/web/src/features/catalog/components/home-discovery.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: زنانه، مردانه، بچگانه، اکسسوری، جدیدترین‌ها، کالکشن‌ها، تخفیف‌ها، روش‌های ارسال، هزینه و زمان ارسال هنگام پرداخت، ضمانت اصالت کالا، تضمین کیفیت و بازگشت کالا، شرایط بازگشت کالا.

رویدادهای JSX ثبت‌شده: Button / onClick؛ Button / onClick / برچسب ساختاری: افزودن به سبد؛ Button / onClick؛ Button / onClick / برچسب ساختاری: افزودن به سبد؛ form / onSubmit / برچسب ساختاری: ایمیل شما / عضویت؛ Button / onClick / برچسب ساختاری: افزودن به سبد. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: متغیری در inventory ثبت نشده است.

نشانگرهای state: selected.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
