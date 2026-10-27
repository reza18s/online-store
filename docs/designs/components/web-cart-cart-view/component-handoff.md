# CartView — design handoff

- **شناسه:** `web-cart-cart-view`
- **محدوده:** `web`
- **منبع:** [`apps/web/src/features/cart/components/CartView.tsx:42-326`](../../../apps/web/src/features/cart/components/CartView.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: این پیشنهاد بدون انتخاب تنوع قابل افزودن نیست.، سبد خرید بارگذاری نشد، لطفاً اتصال خود را بررسی کنید و دوباره تلاش کنید.، تلاش دوباره، NOVA / CART، سبد خرید، سبد خرید شما هنوز خالی است، از میان انتخاب‌های آتلیه، قطعه‌ای برای روزهای پیش رو پیدا کنید.، مشاهده تازه‌ها، خانه، /، کالا در سبد شماست..

رویدادهای JSX ثبت‌شده: MessageCard / onAction؛ CartRefreshNotice / onRetry؛ CartRefreshNotice / onRetry؛ MergeConflictNotice / onResolve؛ CartLineView / onUpdate, onRemove؛ RecommendationCard / onAdd. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: busyVariantId.

نشانگرهای state: success.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
