# CheckoutStepPanel — design handoff

- **شناسه:** `web-checkout-checkout-step-panel`
- **محدوده:** `web`
- **منبع:** [`apps/web/src/features/checkout/components/checkout-step-panel.tsx:25-195`](../../../apps/web/src/features/checkout/components/checkout-step-panel.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: مراحل تکمیل سفارش، مرحله، از ۳، آدرس تحویل، روش ارسال، پرداخت امن، اطلاعات شما فقط برای تکمیل همین سفارش استفاده می‌شود.، کد تخفیف (اختیاری)، کد تخفیف را وارد کنید، در حال محاسبه دوباره مبلغ سفارش...، کد، اعمال شد..

رویدادهای JSX ثبت‌شده: AddressForm / onSelect, onToggleNewAddress, onDraftChange, onCreate؛ ShippingOptions / onChange؛ UiInput / onChange؛ FailurePanel / onRetry؛ Button / onClick / برچسب ساختاری: در حال ثبت امن سفارش... / پرداخت و ثبت سفارش / ادامه. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: متغیری در inventory ثبت نشده است.

نشانگرهای state: success، error.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
