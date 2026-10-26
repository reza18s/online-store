# کارت نشانی و فرم نشانی

- **شناسه:** `web-address-book`
- **اپ/مالک:** web · CustomerAddressForm + CustomerAddressBookPage
- **هدف:** انتخاب نشانی پیش‌فرض و ساخت/ویرایش آن با مسیر روشن برای حذف.
- **مسیرهای مصرف:** /account/addresses، /account/addresses/create، /account/addresses/edit/:id
- **اکشن‌های منبع:** افزودن نشانی، ویرایش نشانی، انتخاب پیش‌فرض، ذخیره، حذف با تأیید بومی
- **حالت‌ها:** فهرست نشانی‌ها، نشانی تازه، ویرایش نشانی، خطای فیلد، در حال ذخیره، تأیید بومی حذف
- **مرجع ظاهر:** Atelier Editorial / Soft Modern، Section 18؛ RTL؛ هدف اشاره‌پذیر دست‌کم ۴۴×۴۴px.

## قرارداد handoff

برد، مدل و state captures فقط مرجع طراحی‌اند. داده‌های نمونه واقعی نیستند. منبع رفتار، فایل‌های ثبت‌شده در `source-index.json` است؛ هیچ مسیر، نقش، API یا قانون دامنه‌ای را از روی ظاهر تغییر ندهید. اختلاف مستندشده در `conflicts.json` را پیش از پیاده‌سازی بازبینی کنید.

## شواهد و محدودیت

- مدل و اندازه‌گیری‌ها از Chromium ساخته شده‌اند؛ وضعیت و شواهد checkها در `qa-report.json` است.
- تعامل React واقعی در این پکیج اجرا نشده؛ `interactive-runtime` عمداً UNVERIFIED است.
- Peyda/Vazirmatn در محیط capture موجود نبودند؛ Tahoma فقط fallback تصویر است.
- assetهای محلی با مجوز نامشخص `UNKNOWN` هستند.
