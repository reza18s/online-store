# وضعیت پروژه NOVA Store

**تاریخ snapshot:** 2026-10-24

**مبنای کد:** شاخه‌ی پیش‌فرض `main` در commit [`aac8b5f`](https://github.com/reza18s/online-store/commit/aac8b5f9e7aa3c62ac83e1ebcfa3a9d9297e0910).

## جمع‌بندی

توسعه‌ی محصول ادامه دارد. در snapshot این گزارش، CI شاخه‌ی `main` موفق است؛ اما شواهد موجود هنوز برای اعلام آمادگی Demo یا Production کافی نیست. Wave 4 و Wave 5 در [plan.md](../plan.md) همچنان gateهای انتشار باز هستند.

## شواهد اعتبارسنجی

- GitHub Actions، اجرای CI شماره‌ی [112](https://github.com/reza18s/online-store/actions/runs/40102720183) روی commit `aac8b5f` را با نتیجه‌ی موفق ثبت کرده است. تمام گام‌های گزارش‌شده، از جمله `Typecheck`، `Lint`، `Validate workflow formatting`، `Test`، `Integration tests`، `Build` و `Validate rendered Compose configuration` موفق بوده‌اند.
- آخرین گزارش تفصیلی runtime محلی در [plan.md](../plan.md)، مربوط به 2026-09-19 است: 489 pass و یک skip اختیاری MinIO، 8/8 integration suite، 13/13 E2E preflight، 70/70 browser test و harnessهای محلی concurrency، notification و media موفق ثبت شده‌اند. این شواهد تاریخی‌اند و در این به‌روزرسانی دوباره اجرا نشده‌اند.
- در مستندات بررسی‌شده شواهد تازه‌ای برای استقرار روی staging، آزمون نهایی staging یا بستن gateهای Production پیدا نشد.

## آمادگی انتشار

| Gate | وضعیت در این snapshot | کار یا شواهد باقی‌مانده |
| --- | --- | --- |
| پیاده‌سازی و CI | در حال توسعه؛ CI اصلی سبز | CI سبز، به‌تنهایی اثبات اجرای همه‌ی flowها روی staging یا production نیست. |
| Demo — Wave 4 | باز؛ آماده‌ی انتشار اعلام نشده | استقرار web، admin، API و worker روی staging با داده‌ی synthetic و reset امن؛ smoke کامل مشتری تا عملیات staff؛ بررسی RTL، responsive و keyboard؛ تأیید health/readiness و worker status. |
| Production — Wave 5 | باز؛ آماده‌ی انتشار اعلام نشده | تأیید providerهای واقعی و sandbox/live smoke؛ domain و TLS؛ مدیریت بیرونی secretها؛ backup و restore موفق برای database و media؛ alerting، retention و rollback؛ اجرای production smoke نهایی. |

## گام بعدی

گام بعدی بستن و ثبت شواهد Wave 4 روی staging است. پس از آن، Wave 5 باید با شواهد provider، بازیابی backup و production smoke بسته شود. تا ثبت این شواهد، وضعیت پروژه را «در حال توسعه؛ هنوز release-ready نیست» در نظر بگیرید.
