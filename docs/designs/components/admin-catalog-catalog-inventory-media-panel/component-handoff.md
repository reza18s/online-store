# MediaPanel — design handoff

- **شناسه:** `admin-catalog-catalog-inventory-media-panel`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/catalog/components/catalog-inventory/media-panel.tsx:35-262`](../../../apps/admin/src/features/catalog/components/catalog-inventory/media-panel.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: رسانه ثبت نشد.، متن جایگزین رسانه را وارد کنید.، بارگذاری رسانه انجام نشد.، در حال دریافت رسانه‌ها...، رسانه‌های محصول در دسترس نیست، دریافت رسانه‌ها انجام نشد.، تلاش دوباره، MEDIA، رسانه محصول، فایل تصویر ابتدا با لینک امن در فضای ذخیره‌سازی بارگذاری و سپس با کنترل نوع، اندازه و ابعاد ثبت می‌شود.، فایل تصویر، متن جایگزین.

رویدادهای JSX ثبت‌شده: Button / onClick / برچسب ساختاری: تلاش دوباره؛ form / onSubmit / برچسب ساختاری: فایل تصویر / متن جایگزین / نوع رسانه؛ UiInput / onChange؛ UiInput / onChange؛ UiSelect / onChange / برچسب ساختاری: نوع رسانه / محصول / جزئیات؛ form / onSubmit / برچسب ساختاری: نشانی رسانه / متن جایگزین / نوع رسانه؛ UiInput / onChange؛ UiInput / onChange. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: draft، error، selectedFile، fileInputKey.

نشانگرهای state: نشانگر متنی ثبت نشده است.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
