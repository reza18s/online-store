# CheckoutPageContent — design handoff

- **شناسه:** `web-checkout-checkout-page-content`
- **محدوده:** `web`
- **منبع:** [`apps/web/src/features/checkout/components/checkout-page-content.tsx:18-107`](../../../apps/web/src/features/checkout/components/checkout-page-content.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: در حال بارگذاری آدرس‌ها، برای تکمیل خرید وارد شوید، برای انتخاب آدرس و ثبت سفارش، ابتدا وارد حساب خود شوید.، ورود به حساب، تلاش دوباره، مرحله ۱ از ۳، آدرس تحویل، برای ادامه‌ی خرید، یک آدرس واقعی برای تحویل سفارش ثبت کنید.، آدرس این مرحله معتبر نیست، یک آدرس معتبر از حساب خود انتخاب کنید.، انتخاب آدرس، سبد خرید.

رویدادهای JSX ثبت‌شده: AddressForm / onSelect, onDraftChange, onCreate. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: متغیری در inventory ثبت نشده است.

نشانگرهای state: نشانگر متنی ثبت نشده است.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
