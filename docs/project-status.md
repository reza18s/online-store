# وضعیت پروژه NOVA Store

**تاریخ snapshot:** 2026-10-26

**مبنای کد:** شاخه‌ی پیش‌فرض `main` در commit [`d15eb6c`](https://github.com/reza18s/online-store/commit/d15eb6c0b54dff3ed789983b6182c876d82cf0fd).

## جمع‌بندی

توسعه‌ی محصول ادامه دارد و شواهد موجود برای اعلام آمادگی Demo یا Production کافی نیست. Wave 4 و Wave 5 در [plan.md](../plan.md) همچنان gateهای انتشار باز هستند. آخرین commit شاخه‌ی `main` در این snapshot `d15eb6c` است؛ دو check به commit سرشاخه‌ی PR شماره‌ی ۲۵ موفق بودند، اما برای commit ادغام‌شده‌ی `d15eb6c` status جداگانه ثبت نشده است.

## شواهد اعتبارسنجی

- دو check با نام `validate` برای سرشاخه‌ی PR شماره‌ی [25](https://github.com/reza18s/online-store/pull/25)، commit `efb2ebe`، با نتیجه‌ی موفق ثبت شده‌اند. این شواهد به سرشاخه‌ی PR مربوط است و جای status مستقل commit ادغام‌شده‌ی `d15eb6c` را نمی‌گیرد.
- GitHub Actions، اجرای CI شماره‌ی [112](https://github.com/reza18s/online-store/actions/runs/40102720183) روی commit قدیمی‌تر `aac8b5f` را با نتیجه‌ی موفق ثبت کرده است. تمام گام‌های گزارش‌شده، از جمله `Typecheck`، `Lint`، `Validate workflow formatting`، `Test`، `Integration tests`، `Build` و `Validate rendered Compose configuration` موفق بوده‌اند؛ این نتیجه به‌تنهایی CI فعلی `main` را اثبات نمی‌کند.
- آخرین گزارش تفصیلی runtime محلی در [plan.md](../plan.md)، مربوط به 2026-09-19 است: 489 pass و یک skip اختیاری MinIO، 8/8 integration suite، 13/13 E2E preflight، 70/70 browser test و harnessهای محلی concurrency، notification و media موفق ثبت شده‌اند. این شواهد تاریخی‌اند و در این به‌روزرسانی دوباره اجرا نشده‌اند.
- در مستندات بررسی‌شده شواهد تازه‌ای برای استقرار روی staging، آزمون نهایی staging یا بستن gateهای Production پیدا نشد.

## وضعیت مستندات طراحی

- مجموعه‌ی [بردهای صفحه](designs/pages/README.md) برای فروشگاه و ادمین ۳۶ گروه صفحه و ۱۰۷ قاب مسیر/حالت دارد؛ schema با AJV Draft 2020-12 معتبر است و پیوندهای معنایی مدل بدون خطاست.
- فهرست مرکزی [بردهای کامپوننت](designs/components/README.md) اکنون ۱۵ بسته را ثبت می‌کند: ۴ بسته‌ی قبلی و ۱۱ بسته‌ی تازه‌ی storefront/admin پس از صفحه‌ها، شامل ۶۰ حالت رفتاری و ۱۲۰ قاب desktop/mobile. هر ۱۱ مدل schema معتبر و layout/responsive QA بدون خطای سرریز، تصویر شکسته یا هدف زیر ۴۴px دارند.
- این مدارک handoff طراحی‌اند. تعامل زنده‌ی کامپوننت‌ها در اپ اجرا نشده، فونت Peyda/Vazirmatn در رندر موجود نبوده، و مجوز دو asset تصویری استفاده‌شده `UNKNOWN` است؛ وضعیت پیاده‌سازی یا آمادگی انتشار پروژه را تغییر نمی‌دهند.

## آمادگی انتشار

| Gate | وضعیت در این snapshot | کار یا شواهد باقی‌مانده |
| --- | --- | --- |
| پیاده‌سازی و CI | در حال توسعه؛ CI اصلی سبز | CI سبز، به‌تنهایی اثبات اجرای همه‌ی flowها روی staging یا production نیست. |
| Demo — Wave 4 | باز؛ آماده‌ی انتشار اعلام نشده | استقرار web، admin، API و worker روی staging با داده‌ی synthetic و reset امن؛ smoke کامل مشتری تا عملیات staff؛ بررسی RTL، responsive و keyboard؛ تأیید health/readiness و worker status. |
| Production — Wave 5 | باز؛ آماده‌ی انتشار اعلام نشده | تأیید providerهای واقعی و sandbox/live smoke؛ domain و TLS؛ مدیریت بیرونی secretها؛ backup و restore موفق برای database و media؛ alerting، retention و rollback؛ اجرای production smoke نهایی. |

## گام بعدی

گام بعدی بستن و ثبت شواهد Wave 4 روی staging است. پس از آن، Wave 5 باید با شواهد provider، بازیابی backup و production smoke بسته شود. تا ثبت این شواهد، وضعیت پروژه را «در حال توسعه؛ هنوز release-ready نیست» در نظر بگیرید.
