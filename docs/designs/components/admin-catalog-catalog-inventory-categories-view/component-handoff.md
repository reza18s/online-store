# CategoriesView — design handoff

- **شناسه:** `admin-catalog-catalog-inventory-categories-view`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/catalog/components/catalog-inventory/categories-view.tsx:29-231`](../../../apps/admin/src/features/catalog/components/catalog-inventory/categories-view.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: شناسه دسته‌بندی و نام معتبر لازم است.، دسته‌بندی ثبت نشد.، نام دسته‌بندی را وارد کنید.، دسته‌بندی ویرایش نشد.، وضعیت دسته‌بندی تغییر نکرد.، در حال دریافت taxonomy...، CATALOG / TAXONOMY، دسته‌بندی‌ها، ساختار طبقه‌بندی با parent واقعی سرویس مدیریت نگهداری می‌شود.، شناسه لاتین، outerwear، نام دسته.

رویدادهای JSX ثبت‌شده: QueryState / onRetry؛ form / onSubmit / برچسب ساختاری: شناسه لاتین / نام دسته / لباس رویی؛ UiInput / onChange؛ UiInput / onChange؛ UiSelect / onChange / برچسب ساختاری: بدون والد؛ CategoryRow / onEdit, onDraftChange, onSave, onCancel, onToggle. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: editingId، draft، newCategory، error.

نشانگرهای state: نشانگر متنی ثبت نشده است.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
