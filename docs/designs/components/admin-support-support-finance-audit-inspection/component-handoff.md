# AuditInspection — design handoff

- **شناسه:** `admin-support-support-finance-audit-inspection`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/support/components/support-finance/audit-inspection.tsx:29-143`](../../../apps/admin/src/features/support/components/support-finance/audit-inspection.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: گزارش رویدادها، عملیات، مثلاً order.cancelled، نوع منبع، Order، شناسه منبع، شناسه، ثبت‌کننده، رویدادی پیدا نشد، فیلترهای گزارش را تغییر دهید یا دوباره تلاش کنید.، فهرست رویدادهای حسابرسی، منبع.

رویدادهای JSX ثبت‌شده: FilterBar / onSubmit / برچسب ساختاری: عملیات / مثلاً order.cancelled / نوع منبع؛ TextFilter / onChange؛ TextFilter / onChange؛ TextFilter / onChange؛ SelectFilter / onChange؛ Pagination / onPageChange. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: draftAction، draftResourceType، draftResourceId، draftActorType، filters.

نشانگرهای state: نشانگر متنی ثبت نشده است.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
