# CustomerReturnPage — design handoff

- **شناسه:** `web-account-customer-return-page`
- **محدوده:** `web`
- **منبع:** [`apps/web/src/features/account/pages/customer-return-page.tsx:44-386`](../../../apps/web/src/features/account/pages/customer-return-page.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: در حال بارگذاری درخواست بازگشت، بازگشت کالا، برای پیگیری یا ثبت درخواست بازگشت ابتدا وارد حساب شوید.، یک سفارش را انتخاب کنید، درخواست بازگشت را از صفحه جزئیات همان سفارش شروع کنید تا اطلاعات واقعی سفارش بررسی شود.، مشاهده سفارش‌ها، RETURNS /، وضعیت درخواست بازگشت، وضعیت فعلی درخواست شما:، ثبت درخواست:، وضعیت بازپرداخت، مبلغ:.

رویدادهای JSX ثبت‌شده: OrderDetailError / onRetry؛ OrderDetailError / onRetry؛ form / onSubmit / برچسب ساختاری: ۱. انتخاب سفارش / سفارش شماره / ۲. انتخاب کالاهای قابل بازگشت؛ UiSelect / onChange / برچسب ساختاری: سفارش شماره؛ Checkbox / onChange؛ UiSelect / onChange؛ UiTextarea / onChange؛ Checkbox / onChange. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: reason، note، confirmed، selectedItemIds، formError، submittedOrder.

نشانگرهای state: selected، error، success.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
