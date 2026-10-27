# ProductEditor — design handoff

- **شناسه:** `admin-catalog-catalog-inventory-product-editor`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/catalog/components/catalog-inventory/product-editor.tsx:62-436`](../../../apps/admin/src/features/catalog/components/catalog-inventory/product-editor.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: محصول ذخیره نشد.، انتشار تا رفع خطاهای فرم مسدود است.، وضعیت محصول تغییر نکرد.، دسته‌بندی محصول ذخیره نشد.، دسترسی مشاهده کاتالوگ ندارید، در حال دریافت محصول...، محصول پیدا نشد، شناسه محصول در سرویس مدیریت وجود ندارد یا دسترسی مشاهده آن محدود شده است.، بازگشت به محصولات، CATALOG / PRODUCT EDITOR، محصول جدید، اطلاعات پایه را ثبت کنید؛ تنوع و رسانه پس از ذخیره فعال می‌شود..

رویدادهای JSX ثبت‌شده: QueryState / onRetry؛ Button / onClick؛ Button / onClick / برچسب ساختاری: آرشیو؛ form / onSubmit / برچسب ساختاری: اطلاعات پایه / شناسه محصول / نام محصول؛ UiInput / onChange؛ UiInput / onChange؛ UiInput / onChange؛ UiInput / onChange. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: localProductId، createdProduct، draft، loadedKey، selectedCategoryIds، error.

نشانگرهای state: نشانگر متنی ثبت نشده است.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
