# OrdersView — design handoff

- **شناسه:** `admin-orders-order-management-orders-view`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/orders/components/order-management/OrdersView.tsx:32-251`](../../../apps/admin/src/features/orders/components/order-management/OrdersView.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: در حال دریافت سفارش‌ها، فهرست واقعی سفارش‌ها از سرویس مدیریت بارگیری می‌شود.، دریافت سفارش‌ها ممکن نشد، دوباره تلاش کنید.، تلاش دوباره، فضای مدیریت / عملیات، سفارش‌ها، پیگیری وضعیت سفارش، ارسال، درخواست بازگشت و بازپرداخت بر اساس داده‌های ثبت‌شده.، مجموع سفارش‌ها:، شاخص‌های سفارش‌ها، کل سفارش‌ها، پرداخت موفق.

رویدادهای JSX ثبت‌شده: Button / onClick / برچسب ساختاری: تلاش دوباره؛ ListFilters / onChange؛ Pagination / onPageChange. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: filters.

نشانگرهای state: success، error.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
