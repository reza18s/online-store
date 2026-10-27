# AdminLoginPage — design handoff

- **شناسه:** `admin-auth-login-page`
- **محدوده:** `admin`
- **منبع:** [`apps/admin/src/features/auth/components/AdminLoginPage.tsx:20-232`](../../../apps/admin/src/features/auth/components/AdminLoginPage.tsx)
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: روایت برند نوا، جزئیات، هویت برند ماست.، PEOPLE · FASHION · DETAILS، مدیریت دنیای نوا از زیبایی، NOVA / ADMIN ACCESS، ورود به فضای مدیریت، برای ادامه، رمز عبور و کد تأیید دومرحله‌ای مدیر را وارد کنید.، نشست مدیریت منقضی شده است؛ برای ادامه دوباره وارد شوید.، ایمیل سازمانی، admin@example.com، رمز عبور، کد تأیید دومرحله‌ای یا کد بازیابی.

رویدادهای JSX ثبت‌شده: form / onSubmit / برچسب ساختاری: ایمیل سازمانی / رمز عبور / کد تأیید دومرحله‌ای یا کد بازیابی؛ UiInput / onChange؛ UiInput / onChange؛ UiInput / onChange. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: email، password، factor، formError، fieldError.

نشانگرهای state: error.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
