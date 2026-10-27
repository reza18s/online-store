# DashboardView — design handoff

- **شناسه:** `admin-dashboard-dashboard-dashboard-view`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/dashboard/components/dashboard/DashboardView.tsx:21-147`](../../../apps/admin/src/features/dashboard/components/dashboard/DashboardView.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: NOVA / ATELIER EDITORIAL، صبح بخیر 👋، خوش آمدید به پنل مدیریت نوا. خلاصه وضعیت فروشگاه را در بازه انتخاب‌شده ببینید.، بازه گزارش، شاخص‌های خلاصه داشبورد، بر اساس داده زنده بازه انتخاب‌شده، LIVE ORDERS، نمودار وضعیت سفارش‌ها، تعداد سفارش‌ها بر اساس وضعیت، در این بازه سفارشی ثبت نشده است.، QUICK ACCESS، دسترسی سریع.

رویدادهای JSX ثبت‌شده: DashboardErrorState / onRetry؛ UiSelect / onChange. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: periodDays.

نشانگرهای state: empty.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
