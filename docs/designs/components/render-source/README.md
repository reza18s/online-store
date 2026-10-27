# رندر مرجع‌های مستقل کامپوننت

این مسیر ابزار مستندسازی طراحی است؛ چیزی در برنامه‌های `apps/web`، `apps/admin` یا `packages/ui` اجرا یا تغییر نمی‌کند.

## رندر همه‌ی هدف‌های بدون برد دقیق

```powershell
python docs/designs/components/render-source/generate-inventory-component-boards.py
```

برای بازتولید یک هدف که قبلاً با همین renderer ساخته شده:

```powershell
python docs/designs/components/render-source/generate-inventory-component-boards.py --component-id shared-ui-button --overwrite-generated
```

بردهای دقیق قدیمی به‌صورت خودکار بازنویسی نمی‌شوند. شناسه‌ی هر کامپوننت از `component-source-inventory.json` خوانده می‌شود؛ renderer پیش از نوشتن، hash فایل منبع را با snapshot ثبت‌شده تطبیق می‌دهد و در اختلاف متوقف می‌شود.

## موتور خروجی

- Python 3.12، Pillow 12.3.0، FreeType و RAQM برای شکل‌دهی راست‌به‌چپ
- board: 1536×1024 پیکسل
- clean reference مستقل: desktop با 1440×900 و mobile با 390×844 پیکسل
- خروجی: PNG به‌همراه مدل JSON، schema Draft 2020-12، scene graph، source/authority/conflict، tokens، asset registry، coverage، QA، manifest و handoff
- عکس محصول، داده‌ی واقعی و درخواست شبکه در خود renderer وجود ندارد؛ ناحیه‌ی رسانه فقط placeholder برداری است.

## فونت تصاویر

- **Estedad SemiBold 8.5** برای تیترهای فارسی.
- **Vazirmatn Regular/SemiBold v33.003** برای متن، برچسب‌ها و کنترل‌های فارسی.
- در طراحی فروشگاه، استفاده از Estedad برای تصویر برد جایگزین پیشنهادی است چون طرح Atelier برای نقش display، Peyda را نام می‌برد. این جایگزینی فقط در raster برد اعمال می‌شود. برای ادمین، Estedad از توکن برد مرجع ناوبری مدیریت گرفته شده است.
- فایل‌های مجوز کنار فایل‌های TTF هستند. provenance و SHA-256 در [FONT-CREDITS.md](FONT-CREDITS.md) ثبت شده‌اند.

## مرز QA

گزارش QA از خروجی‌های محلی، برابری hash منبع، ابعاد PNG و وجود font/RAQM خبر می‌دهد. این تصویرها **پیشنهاد طراحی** هستند: QA آن‌ها اندازه‌گیری DOM زنده، اجرای تعاملی، keyboard، API، role permissions یا تأیید پیاده‌سازی محصول نیست.
