# CustomerAddressBookPage — design handoff

- **شناسه:** `web-account-customer-address-book-page`
- **محدوده:** `web`
- **منبع:** [`apps/web/src/features/account/pages/customer-address-book-page.tsx:36-502`](../../../apps/web/src/features/account/pages/customer-address-book-page.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: در حال بارگذاری آدرس‌ها، آدرس‌های من، برای مدیریت آدرس‌های تحویل ابتدا وارد حساب شوید.، نشست شما منقضی شده است، دسترسی به آدرس‌ها ممکن نیست، اتصال اینترنت برقرار نیست، بارگذاری آدرس‌ها ممکن نشد، برای حفاظت از آدرس‌ها دوباره وارد حساب شوید.، این حساب اجازه مدیریت آدرس‌ها را ندارد.، پس از اتصال دوباره تلاش کنید؛ اطلاعات فرم خصوصی شما ارسال نشده است.، دریافت آدرس‌ها ممکن نشد.، ورود دوباره.

رویدادهای JSX ثبت‌شده: EmptyState / onAction؛ Button / onClick / برچسب ساختاری: قرار دادن به عنوان پیش‌فرض؛ Button / onClick / برچسب ساختاری: حذف؛ CustomerAddressForm / onDelete. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: actionError.

نشانگرهای state: نشانگر متنی ثبت نشده است.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
