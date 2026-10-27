# InventoryDetail — design handoff

- **شناسه:** `admin-catalog-catalog-inventory-inventory-detail`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/catalog/components/catalog-inventory/inventory-detail.tsx:29-242`](../../../apps/admin/src/features/catalog/components/catalog-inventory/inventory-detail.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: در حال دریافت جزئیات موجودی...، اتصال شبکه در دسترس نیست، دریافت اطلاعات انجام نشد، جزئیات موجودی در دسترس نیست.، تلاش دوباره، یک تنوع را انتخاب کنید، برای مشاهده جزئیات و ثبت عملیات، یک ردیف از فهرست موجودی را انتخاب کنید.، INVENTORY DETAIL، تنوع اصلی، ·، فیزیکی، رزروشده.

رویدادهای JSX ثبت‌شده: Button / onClick / برچسب ساختاری: تلاش دوباره؛ Button / onClick / برچسب ساختاری: تلاش دوباره؛ form / onSubmit / برچسب ساختاری: اصلاح موجودی / مقدار تغییر / مثلاً 5 یا -2؛ UiInput / onChange؛ UiTextarea / onChange؛ form / onSubmit / برچسب ساختاری: نقطه سفارش مجدد / حداقل قابل سفارش / ذخیره نقطه سفارش؛ UiInput / onChange. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: متغیری در inventory ثبت نشده است.

نشانگرهای state: loading، error، success.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
