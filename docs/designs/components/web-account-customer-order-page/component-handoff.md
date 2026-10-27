# CustomerOrderPage — design handoff

- **شناسه:** `web-account-customer-order-page`
- **محدوده:** `web`
- **منبع:** [`apps/web/src/features/account/pages/customer-order-page.tsx:29-387`](../../../apps/web/src/features/account/pages/customer-order-page.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: در حال بارگذاری سفارش، جزئیات سفارش، برای مشاهده جزئیات سفارش ابتدا وارد حساب شوید.، دلیل لغو را وارد کنید.، لغو سفارش انجام نشد؛ وضعیت سفارش را دوباره بررسی کنید.، سفارش‌ها، /، ORDER /، پیگیری سفارش، · ثبت‌شده در، درخواست لغو سفارش ثبت شد؛ وضعیت و بازپرداخت فقط از پاسخ سرور پیروی می‌کند.، مسیر سفارش.

رویدادهای JSX ثبت‌شده: OrderDetailError / onRetry؛ OrderDetailError / onRetry؛ Button / onClick / برچسب ساختاری: لغو سفارش؛ form / onSubmit / برچسب ساختاری: لغو سفارش / این درخواست توسط سرور بررسی می‌شود. اگر پرداخت انجام شده باشد، بازپرداخت نیز از همان مسی؛ UiTextarea / onChange؛ Button / onClick / برچسب ساختاری: انصراف. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: cancelOpen، cancelReason، cancelError، cancelSuccess.

نشانگرهای state: empty.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
