# OrderDetailView — design handoff

- **شناسه:** `admin-orders-order-management-order-detail-view`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/orders/components/order-management/OrderDetailView.tsx:65-537`](../../../apps/admin/src/features/orders/components/order-management/OrderDetailView.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: برای ثبت عملیات، دلیل را وارد کنید.، دلیل عملیات نباید بیشتر از ۵۰۰ نویسه باشد.، وضعیت سفارش با موفقیت ثبت شد.، نام سرویس و روش ارسال را وارد کنید.، شناسه رهگیری فقط می‌تواند شامل حروف لاتین، عدد و . _ : - باشد.، اطلاعات ارسال با موفقیت ثبت شد.، دریافت ثبت شد؛ وضعیت بازپرداخت از پاسخ سرویس به‌روزرسانی می‌شود.، بررسی درخواست بازگشت با موفقیت ثبت شد.، عملیات انجام نشد؛ اطلاعات تازه را بررسی و دوباره تلاش کنید.، در حال دریافت جزئیات سفارش، نمایش سفارش از سرویس مدیریت بارگیری می‌شود.، جزئیات سفارش در دسترس نیست.

رویدادهای JSX ثبت‌شده: Button / onClick / برچسب ساختاری: تلاش دوباره؛ OperationsPanel / onShipment, onStatus؛ ReturnPanel / onReview؛ Modal / onClose / برچسب ساختاری: این عملیات طبق قرارداد سرویس، دریافت کالا و فرایند بازپرداخت را ثبت می‌کند. نتیجه موفق یا ناموفق در؛ form / onSubmit / برچسب ساختاری: وضعیت هدف / نتیجه بررسی / سرویس ارسال؛ UiSelect / onChange؛ UiSelect / onChange؛ UiInput / onChange. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: pendingAction، reason، actionError، successMessage، shipmentDraft.

نشانگرهای state: pending، error.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
