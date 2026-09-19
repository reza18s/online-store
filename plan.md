# NOVA Store — برنامه تکمیل برای Demo و Launch

این برنامه بر اساس وضعیت واقعی ریپوی فعلی، `arch.md` و `search.md` نوشته شده است؛ بازنویسی greenfield انجام نمی‌شود. در وضعیت فعلی، storefront عمومی و پنل مدیریت دو frontend مستقل هستند: `apps/web` و `apps/admin`.

## خلاصه

خروجی برنامه دو گیت دارد:

1. **Demo-ready**
   - فروشگاه و پنل مدیریت قابل ارائه به مشتری
   - داده‌ی synthetic و قابل reset
   - providerهای local
   - مسیر کامل کشف محصول تا سفارش
   - پنل سفارش، موجودی، کاتالوگ، محتوا و SEO

2. **Production-ready**
   - providerهای واقعی
   - دامنه و VPS انتخاب‌شده
   - backup/restore تست‌شده
   - observability
   - امنیت و smoke test نهایی

معماری پایه:

- Backend: NestJS modular monolith
- Database: PostgreSQL با Prisma
- Worker: سرویس جدا برای outbox و notification
- Frontend: React + Vite + TypeScript
- Frontends: `apps/web` برای storefront عمومی و SSR، `apps/admin` برای پنل staff/admin با سرور مستقل
- Local frontend servers: web روی `127.0.0.1:5173` و admin روی `127.0.0.1:5174`
- Shared backend: NestJS API روی `127.0.0.1:4000` با قرارداد مشترک `packages/api-client`
- Routing: React Router با حفظ hash compatibility
- Server state: TanStack Query
- Local state: Zustand فقط برای cart/UI
- Styling: Tailwind CSS
- UI primitives: shadcn/ui
- Motion: Animate UI، بدون مالکیت business state
- Storage: S3-compatible، در local با MinIO
- Deployment: Docker Compose، مستقل از vendor

## مرز اجرایی frontendها

- `apps/web`: storefront عمومی، حساب کاربری، cart، checkout و SSR صفحات قابل index؛ بدون route یا module مربوط به admin.
- `apps/admin`: پنل مستقل staff/admin با Vite و dev server جدا روی `127.0.0.1:5174`؛ شامل login staff، navigation، کاتالوگ، موجودی، سفارش، پرداخت/refund، support، content و SEO.
- `apps/api`: backend مشترک روی `127.0.0.1:4000`؛ هر دو frontend فقط از قراردادهای versioned و `packages/api-client` استفاده می‌کنند.
- `packages/ui` و قراردادهای مشترک، مرز اشتراکی مجاز هستند؛ source code مربوط به public web و admin نباید به هم import شود.
- هر frontend query client و route composition مستقل خود را دارد؛ auth و cache boundary مربوط به staff فقط در `apps/admin` قرار دارد.

### آخرین وضعیت اجرایی — 2026-09-19

پس از روشن شدن Docker Desktop، هر دو frontend مستقل و runtime محلی قابل اجرا و
قابل آزمون هستند:

- `apps/web` روی `127.0.0.1:5173` و `apps/admin` روی `127.0.0.1:5174`
- NestJS API روی `127.0.0.1:4000`
- PostgreSQL، Redis و MinIO از Compose محلی
- `bun run typecheck`، `bun run lint`، `bun run build` و `git diff --check` موفق
- `bun run test` — **489 pass، 1 skip اختیاری MinIO**
- `bun run test:integration` — **8/8 suite موفق**
- `bun run test:e2e` — preflight زنده API، PostgreSQL، MinIO و هر دو shell موفق
- `bun run test:e2e:browser` — **70/70 تست موفق** در پروژه‌های Chromium وب و ادمین
- harnessهای live برای concurrency موجودی، notification retry و presigned media
  با database/bucket موقت موفق و بدون residue

`bun run format:check` همچنان به‌دلیل drift قدیمی repository قرمز است و formatter
سراسری برای جلوگیری از churn اجرا نشده است. Provider واقعی، staging، backup/restore
و production deployment هنوز خارج از این validation محلی هستند.

## وضعیت فعلی و Featureهای محصول

| Feature                | چرا لازم است                        | روش ساخت                                                                            | وضعیت فعلی                                                                                    |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| فروشگاه عمومی          | نمایش برند و جذب مشتری              | `apps/web`، React Router، صفحات public، SSR برای صفحات indexable                    | frontend جدا و build/typecheck/test آن فعال است؛ live provider/browser gates جداگانه باقی است |
| کاتالوگ و دسته‌بندی    | پیدا کردن سریع محصول                | PostgreSQL full-text، `pg_trgm`، نرمال‌سازی فارسی، facet و pagination               | Backend عمدتاً موجود؛ تکمیل UI و اتصال نهایی لازم است                                         |
| صفحه محصول و واریانت   | انتخاب سایز/رنگ و افزایش conversion | variant availability از API، media lifecycle، قیمت و موجودی authoritative           | بخش‌هایی موجود؛ wiring و visual completion لازم است                                           |
| جست‌وجو و پیشنهاد      | کاهش اصطکاک discovery               | search API، suggestion، typo tolerance و query-state در URL                         | قرارداد موجود؛ تکمیل مسیر public و SSR لازم است                                               |
| سبد خرید               | حفظ intent کاربر                    | TanStack Query برای داده‌ی server، Zustand برای UI/cart intent، merge conflict صریح | بخش زیادی موجود؛ مسیر دمو باید end-to-end تست شود                                             |
| Checkout               | تبدیل cart به order                 | quote، آدرس، هزینه ارسال، reservation، idempotency و snapshot                       | Backend موجود؛ UI و browser flow باید تکمیل شود                                               |
| پرداخت                 | دریافت پول و کنترل خطا              | `PaymentGateway`، callback verification، replay protection، late payment و refund   | local adapter موجود؛ سناریوهای دمو و provider واقعی باید certify شوند                         |
| سفارش و fulfillment    | عملیات بعد از خرید                  | state machine، order events، shipment state و audit                                 | Backend موجود؛ پنل و مسیر مشتری باید تکمیل شود                                                |
| حساب کاربری            | مشاهده سفارش و مدیریت آدرس          | OTP مشتری، session، address CRUD، order history و return request                    | API و بخشی از frontend موجود                                                                  |
| مرجوعی و refund        | اعتماد مشتری و پشتیبانی             | درخواست مشتری، تصمیم staff، refund idempotent و audit                               | API موجود؛ UI و browser flow باقی‌مانده                                                       |
| پنل مدیریت             | اجرای عملیات کسب‌وکار               | `apps/admin` مستقل، role guard برای SUPPORT/OPERATIONS/ADMIN، audit و pagination    | frontend مستقل روی پورت 5174؛ build/typecheck/test موفق؛ live staff/provider gates باقی است   |
| کاتالوگ و موجودی ادمین | کنترل محصول و stock                 | mutationهای audited، optimistic concurrency، stock movement و reorder point         | UI و API در `apps/admin`/API جدا شده‌اند؛ سناریوهای عملیاتی live باقی است                     |
| محتوا و SEO            | اعتماد و indexability               | public rendering در web و admin lifecycle در `apps/admin`                           | public/API/admin transport موجود؛ live CMS/provider validation باقی است                       |
| رسانه                  | تصویر محصول و محتوای بصری           | presigned upload، S3/MinIO، quarantine و lifecycle                                  | boundary موجود؛ upload flow و production storage باید تکمیل شود                               |
| Notification           | اطلاع‌رسانی سفارش و پرداخت          | transactional outbox، worker، retry، lease، dedupe و provider adapter               | worker و local sender موجود؛ عملیات و provider واقعی باید تکمیل شود                           |
| Analytics              | سنجش conversion                     | eventهای privacy-safe مثل view، search، cart، checkout و purchase                   | به‌صورت محدود/اختیاری؛ instrumentation پایه اضافه می‌شود                                      |
| زیرساخت                | اجرای قابل اعتماد                   | Docker Compose، health checks، restart policy، secrets، backup و restore            | local foundation موجود؛ staging و production باقی‌مانده                                       |

## Wave 0 — تثبیت و قراردادها

این wave فقط توسط head/integration owner انجام می‌شود و پیش‌نیاز همه‌ی کارهای موازی است.

### ORCH-01 — ممیزی baseline ریپو

- وضعیت فعلی Git، تغییرات uncommitted، فایل‌های حذف‌شده و فایل‌های جدید ثبت شود.
- تغییرات فعلی frontend دور ریخته نشوند.
- فایل‌های متعلق به featureهای دیگر بدون دلیل بازنویسی نشوند.
- مالکیت هر قسمت مشخص شود: API، DB، public web (`apps/web`)، admin web
  (`apps/admin`)، worker، infra، QA.

**خروجی:** baseline قابل فهم و فهرست دقیق gapها.

### CONTRACT-01 — تثبیت قراردادهای مشترک

قراردادهای زیر قبل از parallel execution نهایی شوند:

- API route و DTOهای checkout/order/payment/return
- role و permission matrix
- order/payment/shipment/return state machine
- Prisma migration ownership
- `packages/api-client` به‌عنوان مرز frontend/backend
- provider interfaceها
- environment keyها
- seed و reset contract

**قانون:** هیچ agentی schema، API client یا state machine مشترک را بدون هماهنگی head تغییر ندهد.

### ORCH-02 — تقسیم branch و worktree

برای هر stream یک branch/worktree جدا:

- `backend-data`
- `customer-web`
- `admin-content`
- `infra-worker-qa`

Head agent مسئول integration، review و validation نهایی است.

## Wave 1 — Foundation برای اجرای موازی

پس از تثبیت قراردادها، این تسک‌ها می‌توانند موازی اجرا شوند.

### DATA-01 — Seed curated و resetپذیر

- seed فارسی و RTL برای دسته‌ها، محصولات، واریانت‌ها، media، قیمت، stock، coupon، content page، مشتری، سفارش و return ایجاد شود.
- seed کاملاً synthetic باشد.
- seed تکرارپذیر و قابل reset باشد.
- credentialهای local فقط در development/test فعال باشند.
- staging هیچ fixture جعلی frontend دریافت نکند و فقط API/PostgreSQL واقعی بخواند.

**قبولی:** اجرای seed از محیط خالی، database قابل استفاده برای دمو بسازد و دوباره قابل تکرار باشد.

### API-01 — بستن gapهای backend

- ماژول‌های موجود بررسی شوند؛ ماژول موازی یا duplicate ساخته نشود.
- فقط endpoint، validation، transaction یا integration ناقص تکمیل شود.
- Prisma تنها مالک schema و migration بماند.
- PostgreSQL منبع حقیقت قیمت، stock، order و payment باشد.
- transaction boundaryهای checkout، payment، refund و inventory حفظ شوند.

**قبولی:** مسیرهای API موردنیاز vertical slice با `packages/api-client` سازگار باشند.

### WEB-01 — routing و rendering foundation

- React Router مالک اصلی route باشد.
- public routeهای تمیز برای catalog/product/content ساخته شوند.
- hash route فعلی برای compatibility حفظ شود.
- public pages برای SSR/indexability آماده شوند.
- account/checkout در `apps/web` client-side و noindex باقی بمانند.
- admin از storefront جدا باشد و در `apps/admin` با Vite مستقل، مسیرهای staff و
  noindex اجرا شود.
- `bun run dev` فقط web را روی 5173 اجرا کند و `bun run dev:admin` فقط admin را
  روی 5174 اجرا کند؛ هر دو از API مشترک 4000 استفاده کنند.
- TanStack Query server state را مدیریت کند.
- Zustand فقط cart/UI intent را نگه دارد.

### INFRA-01 — staging Compose

- topology شامل public web، admin web مستقل، API، worker، PostgreSQL، Redis و
  S3-compatible storage باشد.
- health/readiness، restart policy و isolated volumes تنظیم شوند.
- secrets از repository خارج باشند.
- staging با synthetic data و reset امن اجرا شود.
- vendor/domain/backup destination به‌عنوان gate لانچ باقی بماند، نه فرض مخفی.

### QA-01 — ماتریس تست

از ابتدا تست‌های زیر ثبت شوند:

- customer critical path
- staff role boundary
- inventory concurrency
- payment replay/idempotency
- return/refund
- SSR metadata و redirect
- RTL/responsive/accessibility
- provider fail-closed
- seed reset و health checks

## Wave 2 — Vertical Slice اصلی

این wave باید اولین خروجی قابل ارائه را بسازد.

### CUSTOMER-01 — کشف تا صفحه محصول

- home/category/search/product routeها تکمیل شوند.
- فیلتر، sorting، pagination و suggestion از API واقعی خوانده شوند.
- Persian normalization و typo tolerance قابل مشاهده باشد.
- product variant، قیمت، موجودی و media واقعی نمایش داده شود.
- loading، empty، error و offline state وجود داشته باشد.

### CUSTOMER-02 — سبد تا سفارش

- add/update/remove cart با API واقعی انجام شود.
- cart merge conflict شفاف نمایش داده شود.
- checkout quote شامل subtotal، discount، shipping و total باشد.
- inventory reservation و expiry در UI قابل مدیریت باشد.
- local payment سناریوهای موفق، ناموفق و replay را پوشش دهد.
- صفحه موفقیت/شکست و order detail ساخته شود.

### STAFF-01 — ورود و shell پنل

- پنل staff در `apps/admin` نگهداری شود و هیچ admin component/page/API moduleی
  در `apps/web` باقی نماند.
- staff login با password + TOTP باقی بماند.
- session جدا از customer session باشد.
- SUPPORT، OPERATIONS و ADMIN با permissionهای واقعی تست شوند.
- navigation بر اساس permission فیلتر شود.
- صفحات loading/error/forbidden طراحی شوند.
- staff query cache و redirect نشست منقضی‌شده در admin query client متمرکز باشد.

### OPS-01 — مشاهده سفارش در پنل

- سفارش ساخته‌شده از vertical slice در پنل دیده شود.
- order detail، payment attempt، shipment و event timeline نمایش داده شود.
- تغییر وضعیت order/fulfillment audit داشته باشد.
- inventory و reserved stock در پنل قابل مشاهده باشند.

### WORKER-01 — notification و outbox

- payment success/failure notification از transaction به outbox برود.
- worker با lease، retry، dedupe و terminal failure کار کند.
- local sender برای دمو deterministic باشد.
- backlog و failure در operational read قابل مشاهده باشد.

### گزارش تکمیل Wave 2 — 2026-09-19

پیاده‌سازی Wave 2 تکمیل شد و هر stream با source audit و تست‌های مربوطه
بازبینی شد:

- `CUSTOMER-01`: مسیرهای واقعی home/category/search/product، queryهای catalog،
  suggestion، filter/sort/pagination، variant/price/stock/media و stateهای
  loading/empty/error/offline موجود و به API متصل هستند.
- `CUSTOMER-02`: mutationهای واقعی cart، merge conflict، quote کامل، local
  payment و recovery/order detail موجود هستند؛ اعتبار quote اکنون با timer در
  checkout نمایش داده می‌شود و در لحظه‌ی انقضا ادامه‌ی checkout را می‌بندد.
- `STAFF-01`: login password+TOTP، session و query boundary مستقل، role guard و
  stateهای loading/error/forbidden/expired موجود هستند؛ navigation desktop و
  mobile بر اساس `SUPPORT`/`OPERATIONS`/`ADMIN` فیلتر می‌شود.
- `OPS-01`: order detail، payment attempt، shipment، event/audit timeline و
  وضعیت `onHand`/`reserved`/`available` در پنل عملیاتی موجود هستند.
- `WORKER-01`: callback پرداخت و outbox در transaction مشترک، dedupe، lease،
  retry، terminal failure و local sender موجود هستند؛ completion/retry worker با
  lease fencing در برابر worker قدیمی محافظت می‌شود.

شواهد validation نهایی:

- `bun run test`: **481 pass، 1 skip اختیاری MinIO**
- `bun run typecheck`: موفق
- `bun run lint`: موفق
- `bun run build`: موفق؛ فقط warningهای معمول Vite و chunk size باقی است
- `bun run test:e2e:browser -- --list`: **70 تست در 28 فایل**

این baseline پیش از روشن شدن Docker ثبت شده بود؛ وضعیت نهایی و شواهد runtime در
گزارش Wave 3 پایین‌تر ثبت شده است.

## Wave 3 — تکمیل breadth محصول

### CUSTOMER-03 — account و return

- OTP login و logout
- آدرس‌های ذخیره‌شده
- order history و order detail
- cancel eligibility
- ایجاد return request با دلیل و item
- نمایش وضعیت return و refund

### ADMIN-02 — کاتالوگ، موجودی و media

- product/category/variant CRUD
- publish/draft/archive lifecycle
- media upload با presigned URL
- primary image safeguard
- stock adjustment و reorder point
- optimistic concurrency و audit

### ADMIN-03 — سفارش، پرداخت و مرجوعی

- order search و detail
- fulfillment/shipment state
- payment/refund inspection
- return approve/reject
- refund retry idempotent
- customer support lookup
- notification inspection با redaction

### CMS-01 — محتوا و SEO

- public published content pages
- admin draft-first editor
- optimistic concurrency
- SEO metadata
- redirect management
- SSR metadata resolver
- sitemap و robots
- clean public URL و hash compatibility

### MEDIA-01 — storage lifecycle

- upload initiation
- presigned upload
- metadata validation
- quarantine
- association با Product/Content
- حذف نرم و cleanup امن
- MinIO در Demo و S3-compatible storage در Production

### ANALYTICS-01 — رویدادهای پایه

فقط eventهای privacy-safe ثبت شوند:

- product view
- search
- add to cart
- checkout started
- purchase
- payment failure
- provider failure

اطلاعات حساس، OTP، token و داده‌ی payment وارد event نشود.

### گزارش تکمیل Wave 3 — 2026-09-19

Wave 3 برای قراردادهای موجود پروژه تکمیل شد:

- `CUSTOMER-03`: OTP/session logout، آدرس‌های ذخیره‌شده، order history/detail،
  cancel eligibility هم‌راستا با API، return request و نمایش وضعیت return/refund
  در مسیرهای account به API واقعی متصل هستند.
- `ADMIN-02`: CRUD محصول/category/variant، lifecycle محصول، inventory adjustment و
  reorder point، optimistic concurrency/audit و safeguard تصویر اصلی در UI و API
  پوشش داده شده‌اند. پنل ادمین اکنون presign → PUT به original/derivative →
  complete را با اعتبارسنجی نوع، حجم و ابعاد اجرا می‌کند؛ URL موجود قبلی نیز به‌عنوان
  fallback حفظ شده است.
- `ADMIN-03`: جست‌وجو و جزئیات سفارش، fulfillment/shipment، payment/refund، review
  مرجوعی، retry idempotent refund، lookup مشتری و notification inspection با redaction
  موجود و تست شده‌اند.
- `CMS-01`: public published content، draft-first editor، optimistic concurrency،
  SEO/redirect، resolver متادیتای SSR، sitemap/robots و clean/hash URL در قراردادهای
  موجود کامل هستند.
- `MEDIA-01`: lifecycle ذخیره‌سازی شامل presign، metadata validation، quarantine،
  association محصول، حذف نرم و cleanup امن در API موجود است؛ Demo از MinIO و Production
  از S3-compatible storage استفاده می‌کند. CMS در قرارداد فعلی به‌جای relation جداگانه‌ی
  asset، media reference را داخل payload بلاک محتوای bounded نگه می‌دارد و asset-id جدیدی
  خارج از این قرارداد اضافه نشده است.
- `ANALYTICS-01`: endpoint privacy-safe برای `product_view`، `search`، `add_to_cart`،
  `checkout_started`، `purchase`، `payment_failure` و `provider_failure` اضافه شد؛
  propertyها allowlist و scalar هستند و هویت customer فقط از session سمت سرور می‌آید.

شواهد validation نهایی Wave 3:

- `bun run test`: **489 pass، 1 skip اختیاری MinIO**
- `bun run typecheck`: موفق
- `bun run lint`: موفق
- `bun run build`: موفق؛ warningهای معمول Vite/CJS و chunk size باقی است
- `bun run --cwd packages/api-client contract:check`: **17 pass**
- `bun run test:e2e:browser -- --list`: **70 تست در 28 فایل**
- `git diff --check`: موفق
- `bun run test:e2e` — preflight زنده **13/13 check موفق**
- `bun run test:integration` — **8/8 suite موفق**
- `bun run test:e2e:browser` — **70/70 تست موفق**؛ admin tests روی origin مستقل
  `127.0.0.1:5174` اجرا می‌شوند.
- concurrency live — یک fulfillment و یک rejection برای موجودی واحد، سپس cleanup
  کامل و بازگشت موجودی به baseline
- notification live — claim/retry با `attempts=1`، وضعیت `PENDING` و cleanup کامل
- media live — login/CSRF، presign، PUT original/derivative، complete، read و
  quarantine/delete با cleanup کامل bucket و database

بنابراین browser، database-backed و object-storage-backed local gates بسته شدند.
Provider واقعی، staging، backup/restore و production deployment همچنان gateهای
بعدی هستند.

## Wave 4 — Demo Release Gate

دمو زمانی آماده است که:

- فروشگاه و پنل مدیریت روی staging VPS اجرا شوند.
- فقط داده‌ی synthetic داشته باشند.
- public web و admin به‌صورت دو frontend/process مستقل deploy شوند؛ هر دو به API مشترک متصل باشند.
- مسیر زیر بدون mock ناقص کار کند:

```text
Public storefront
→ search/category/product
→ variant selection
→ cart
→ checkout quote
→ local payment success/failure
→ order detail
→ staff order inspection
→ fulfillment/return/refund
```

- پنل content و SEO در `apps/admin` قابل استفاده باشد و خروجی public آن در `apps/web` درست نمایش داده شود.
- seed reset قابل اجرا باشد.
- fixtureهای frontend خارج از development/test فعال نشوند.
- فارسی، RTL، responsive و keyboard navigation بررسی شوند.
- خطای بحرانی در console، API و browser وجود نداشته باشد.
- health/readiness و worker status قابل بررسی باشد.

Validation:

```powershell
bun run format:check
bun run lint
bun run typecheck
bun run test:local-providers
bun run test
bun run build
bun run docker:config
bun run test:e2e:browser
```

همچنین browser smoke test برای customer و هر سه staff role اجرا شود.

## Wave 5 — Production Release Gate

### PROVIDER-01

- ZarinPal یا gateway انتخاب‌شده با `PaymentGateway`
- Sms.ir با `SmsProvider`
- provider ارسال واقعی با `ShippingProvider`
- Object storage واقعی با `ObjectStorage`

همه‌ی providerها باید:

- credential واقعی داشته باشند؛
- fail-closed باشند؛
- callback verification داشته باشند؛
- replay و idempotency تست شده باشند؛
- contract test و sandbox/live smoke test داشته باشند.

### OPS-02 — Backup و recovery

- backup PostgreSQL اجرا شود.
- restore روی target جدا انجام شود.
- تعداد و صحت جدول‌ها بررسی شود.
- recovery evidence ثبت شود.
- backup media و retention به‌صورت جداگانه مشخص شود.
- بدون restore موفق، Production-ready اعلام نشود.

### DEPLOY-01 — لانچ

- domain و TLS
- reverse proxy
- production environment
- external secret management
- Docker Compose production topology
- migrations با rollout امن
- health checks
- restart policy
- log retention
- alerting
- rollback procedure

### RELEASE-01 — Production smoke

- login مشتری و staff
- browse/search/product
- cart و checkout
- payment callback
- order creation
- shipping quote
- notification delivery
- admin order operation
- return/refund
- media upload
- backup verification

## ترتیب وابستگی

```text
Baseline audit
  ↓
Shared contracts + seed/environment
  ↓
Router/API/Compose foundation
  ↓
Customer vertical slice + Staff order slice
  ↓
Admin breadth + CMS/SEO + account/returns
  ↓
Demo staging gate
  ↓
Real provider certification
  ↓
Backup/restore + production deployment
  ↓
Production smoke gate
```

Streamهای موازی:

- Backend/Data: `CONTRACT-01`, `API-01`, `DATA-01`
- Customer Web: `WEB-01`, `CUSTOMER-01`, `CUSTOMER-02`, `CUSTOMER-03`
- Admin/CMS: `STAFF-01`, `OPS-01`, `ADMIN-02`, `ADMIN-03`, `CMS-01`
- Infra/Worker/QA: `INFRA-01`, `WORKER-01`, `MEDIA-01`, `QA-01`, `RELEASE-01`

هیچ streamی قبل از تثبیت قراردادهای مشترک نباید schema یا public contract را تغییر دهد.

## تصمیم‌های خارج از این برنامه

این موارد برای V1 ساخته نمی‌شوند:

- marketplace
- multi-warehouse
- native mobile app
- loyalty
- recommendation engine
- چند payment gateway
- COD
- قیمت‌گذاری زنده‌ی shipping در Demo
- live carrier pricing غیرقابل کنترل
- microservices
- Kafka یا queue platform مستقل
- Kubernetes
- multi-region
- realtime chat/presence
- rule engine عمومی

## معیار نهایی تکمیل

برنامه فقط زمانی کامل است که:

- Demo برای ارائه به مشتری آماده باشد.
- Production مسیر واقعی خرید و عملیات را بدون mock اجرا کند.
- API، DB، دو frontend (`apps/web` و `apps/admin`)، worker و deployment به هم متصل باشند.
- هیچ fixture جعلی وارد staging/production نشود.
- providerها fail-closed و قابل مشاهده باشند.
- پرداخت، موجودی، refund و return idempotent و auditشده باشند.
- backup/restore واقعاً تست شده باشد.
- validationهای Demo و Production با موفقیت اجرا شده باشند.
- تغییرات فعلی ریپو حفظ و فقط با review head agent integrate شوند.

فرض‌های نهایی:

- زبان اصلی فارسی و RTL است.
- واحد پول تومان با integer storage است.
- محصول single-merchant و Iran-first است.
- داده‌ی staging synthetic است.
- provider واقعی فقط در Production certify می‌شود.
- hosting vendor-neutral و Docker Compose است.
- public web و admin دو process/frontend مستقل هستند و API را به‌صورت مشترک مصرف می‌کنند.
- انتخاب VPS، دامنه و backup destination پیش‌نیاز قطعی Wave 5 است.
