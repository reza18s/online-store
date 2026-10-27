# LocalPaymentPage — design handoff

- **شناسه:** `web-checkout-local-payment-page`
- **محدوده:** `web`
- **منبع:** [`apps/web/src/features/checkout/components/local-payment-page.tsx:13-74`](../../../apps/web/src/features/checkout/components/local-payment-page.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: لینک پرداخت محلی کامل نیست؛ سفارش شما تغییر نکرده است.، پرداخت محلی تأیید نشد؛ وضعیت سفارش خود را بررسی کنید.، تکمیل پرداخت محلی ممکن نشد؛ دوباره تلاش کنید.، پرداخت انجام نشد، در حال تکمیل پرداخت محلی، پرداخت آزمایشی بدون اتصال به درگاه خارجی در حال ثبت است.، بررسی وضعیت سفارش.

رویدادهای JSX ثبت‌شده: event مستقیمی در inventory ثبت نشده است. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: error.

نشانگرهای state: نشانگر متنی ثبت نشده است.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
