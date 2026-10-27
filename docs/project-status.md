# وضعیت پروژه NOVA Store

**تاریخ snapshot:** 2026-10-27

**مبنای وضعیت کد:** شاخه‌ی پیش‌فرض `main` در commit [`6e4770d`](https://github.com/reza18s/online-store/commit/6e4770d05ca67b2fecd337298359de8c6d838176)؛ این commit ادغام PR شماره‌ی ۲۶ است.

## جمع‌بندی

توسعه‌ی محصول ادامه دارد و شواهد موجود برای اعلام آمادگی Demo یا Production کافی نیست. Wave 4 و Wave 5 در [plan.md](../plan.md) همچنان gateهای انتشار باز هستند. snapshot سورس روی `main` در `6e4770d` ثابت شده است. برای این commit، بررسی GitHub در تاریخ snapshot هیچ combined status یا workflow run برنگرداند؛ بنابراین CI این commit **UNVERIFIED** است، نه سبز.

## شواهد اعتبارسنجی

- **CI شاخه‌ی اصلی:** GitHub برای `6e4770d05ca67b2fecd337298359de8c6d838176`، `statuses: []` و `workflow_runs: []` برگرداند. اجرای قدیمی CI یا نتیجه‌ی شاخه‌ی یک PR جای CI همین commit را نمی‌گیرد.
- **CI تاریخی:** اجرای Actions شماره‌ی [112](https://github.com/reza18s/online-store/actions/runs/40102720183) روی commit قدیمی‌تر `aac8b5f` در snapshot قبلی موفق گزارش شده بود. این مدرک تاریخی است و وضعیت امروز main را ثابت نمی‌کند.
- **Runtime تاریخی:** آخرین گزارش تفصیلی در [plan.md](../plan.md)، مربوط به 2026-09-19 است؛ passها و smokeهای ثبت‌شده همان زمان اجرا شده‌اند و در این snapshot دوباره اجرا نشده‌اند.
- برای استقرار روی staging، آزمون نهایی staging، یا بستن gateهای Production، مدرک تازه‌ای ثبت نشده است.

## وضعیت مستندات طراحی

- مجموعه‌ی [بردهای صفحه](designs/pages/README.md) برای storefront و admin **۳۶ گروه صفحه و ۱۰۷ قاب مسیر/حالت** دارد.
- [فهرست تک‌به‌تک کامپوننت‌ها](designs/components/README.md) اکنون **۱۹۵ هدف تصویری مستقل** را ثبت می‌کند: ۱۲ برد دقیق از قبل موجود و ۱۸۳ برد تازه برای storefront، admin و shared UI. برای هر هدف ردیف مستقل، منبع/خط، اکشن و state منبع، برد و گزارش QA ثبت شده است.
- **۸ wrapper/provider/router** سطح بصری مستقل ندارند؛ دلیل و پوشش آن‌ها در بردهای صفحه آمده است. سه بسته‌ی تکمیلی filter sidebar، category sort و order action خارج از شمار ۱۹۵ هستند.
- اعتبارسنجی ۱۸۳ بسته‌ی تازه: JSON Schema Draft 2020-12، تطبیق hash سورس، فایل‌ها و manifest، فونت‌ها، ابعاد PNG و ارجاع/محدوده‌های scene graph همگی PASS شدند. QA کلی `PASS_WITH_WARNINGS` است، چون runtime زنده‌ی کامپوننت‌ها بررسی نشده است.
- بردها فقط مستند طراحی‌اند. کد برنامه تغییر نکرده، تعامل واقعی UI/API و مجوز عکس‌ها بررسی نشده‌اند و نتیجه‌ی این کار وضعیت انتشار محصول را تغییر نمی‌دهد.
- تیترهای تصویری با Estedad SemiBold و متن‌های فارسی با Vazirmatn رندر می‌شوند؛ provenance و مجوز در [FONT-CREDITS.md](designs/components/render-source/FONT-CREDITS.md) ثبت شده است. این انتخاب فقط به تصویر بردها مربوط است.

## آمادگی انتشار

| Gate | وضعیت در این snapshot | کار یا مدرک باقی‌مانده |
| --- | --- | --- |
| پیاده‌سازی و CI | در حال توسعه؛ CI commit `6e4770d` نامشخص | status یا workflow run قابل انتساب به commit فعلی main موجود نیست؛ CI سبز، به‌تنهایی اثبات staging/production نیست. |
| Demo — Wave 4 | باز؛ آماده‌ی انتشار اعلام نشده | استقرار web، admin، API و worker روی staging با داده‌ی synthetic و reset امن؛ smoke کامل مشتری تا عملیات staff؛ بررسی RTL، responsive و keyboard؛ تأیید health/readiness و worker status. |
| Production — Wave 5 | باز؛ آماده‌ی انتشار اعلام نشده | تأیید providerهای واقعی و sandbox/live smoke؛ domain و TLS؛ مدیریت بیرونی secretها؛ backup و restore موفق برای database و media؛ alerting، retention و rollback؛ اجرای production smoke نهایی. |

## گام بعدی

گام بعدی بستن و ثبت شواهد Wave 4 روی staging است. پس از آن، Wave 5 باید با شواهد provider، بازیابی backup و production smoke بسته شود. تا ثبت این شواهد، وضعیت پروژه «در حال توسعه؛ هنوز release-ready نیست» است.
