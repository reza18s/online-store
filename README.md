# NOVA Store

NOVA Store یک پلتفرم فروش تک‌فروشنده و Iran-first برای مشتریان فارسی‌زبان است. منبع حقیقت محصول و معماری arch.md است و برنامه‌ی اجرای مرحله‌ای در plan.md قرار دارد.

## ساختار workspace

- apps/web: storefront عمومی، حساب مشتری، cart، checkout و SSR صفحات قابل index
- apps/admin: پنل مستقل staff/admin با Vite روی پورت 5174
- apps/api: API مشترک NestJS روی پورت 4000
- apps/worker: worker مستقل برای outbox، notification و retry
- packages/api-client: قرارداد و client مشترک frontend/backend
- packages/db: Prisma schema، migration، seed و database client
- packages/config: environment validation و provider configuration
- packages/ui: primitiveهای مشترک shadcn-style

کد public نباید از apps/admin import شود و کد admin نباید در apps/web قرار بگیرد. هر frontend query client، route composition و auth/cache boundary مستقل خود را دارد و هر دو فقط از API مشترک و packages/api-client استفاده می‌کنند.

## Stack

- Bun 1.3.4 workspace
- React + Vite + TypeScript
- React Router با حفظ hash compatibility
- Tailwind CSS
- shadcn/ui-style primitives
- Animate UI/CSS motion بدون مالکیت business state
- TanStack Query برای server state
- Zustand فقط برای cart و UI intent
- NestJS + Prisma + PostgreSQL
- Redis برای state موقت و coordination
- S3-compatible storage؛ MinIO در local

## آماده‌سازی اولیه

پیش‌نیازها:

- Bun 1.3.4
- Node.js >=22
- Docker Desktop با Linux engine فعال

در اولین اجرا:

```powershell
bun install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
bun run db:generate
bun run docker:config
```

فایل .env فقط برای local است و در Git ignore می‌شود. credentialهای آن synthetic هستند و نباید در staging یا production استفاده شوند.

## اجرای local

ابتدا API و dependencyهای local را اجرا کنید:

```powershell
bun run dev:api:local
```

سپس در terminalهای جدا:

```powershell
bun run dev
bun run dev:admin
bun run dev:worker
```

آدرس‌ها:

- Storefront: http://127.0.0.1:5173
- Admin: http://127.0.0.1:5174/admin/login
- API: http://127.0.0.1:4000
- Liveness: http://127.0.0.1:4000/health/live
- Readiness: http://127.0.0.1:4000/health/ready
- MinIO API: http://127.0.0.1:59000
- MinIO console: http://127.0.0.1:59001

اگر API را بدون helper اجرا می‌کنید:

```powershell
docker compose --env-file .env -f infra/docker/compose.yml up -d postgres redis s3
bun run db:migrate
bun run db:seed
bun run dev:api
```

`DEMO_SEED=true` در local به‌صورت پیش‌فرض داده synthetic قابل تکرار برای catalog، CMS، مشتری، سفارش و مرجوعی می‌سازد؛ برای database غیر‌دمو آن را `false` کنید. اجرای `DEMO_SEED=true` در production عمداً fail closed است.

برای staff local:

```text
email:    admin@nova.local
password: nova-local-admin-password-2026
factor:   خروجی bun run local:staff-code
```

```powershell
bun run local:staff-code
```

این credentialها فقط در development/test معتبرند. برای customer OTP نیز local adapter استفاده می‌شود و SMS واقعی ارسال نمی‌شود.

## Providerهای local و واقعی

در development/test این adapterها استفاده می‌شوند:

- local OTP delivery
- local payment gateway
- local shipping quote
- local notification sender
- MinIO برای object storage

در staging/production providerهای واقعی پشت boundaryهای زیر قرار می‌گیرند و تا زمانی که credential و contract معتبر نداشته باشند fail closed هستند:

- PaymentGateway
- SmsProvider
- ShippingProvider
- ObjectStorage

برای production فعلاً boundaryهای ZarinPal، Sms.ir و Iran Post در configuration وجود دارند؛ انتخاب نهایی endpoint، credential، domain، hosting و backup destination باید قبل از Production Release Gate تأیید شود.

## Validation

چک‌های اصلی:

```powershell
bun run format:check
bun run lint
bun run typecheck
bun run test
bun run test:local-providers
bun run build
bun run docker:config
```

تست browser:

```powershell
bun run test:e2e:browser
```

تست‌های live مانند PostgreSQL/Redis/MinIO، browser authenticated flow، provider sandbox و backup/restore فقط وقتی معتبرند که dependencyهای مربوطه واقعاً در حال اجرا باشند.

## وضعیت baseline فعلی

در baseline آماده‌شده:

- bun run typecheck موفق است.
- bun run lint موفق است.
- bun run test موفق است؛ ۴۷۴ تست pass و یک تست اختیاری MinIO skip شده است.
- bun run test:local-providers با 56/56 موفق است.
- bun run build موفق است؛ اجرای build در محیط sandbox به مجوز خارج از sandbox برای esbuild نیاز داشت.
- bun run docker:config موفق است.
- bun run format:check هنوز به‌دلیل debt formatting موجود در چندین فایل fail می‌شود؛ برای جلوگیری از formatting churn گسترده، formatter سراسری اجرا نشده است.

اگر Docker Desktop Linux engine در دسترس نباشد، تست‌های database-backed، worker runtime، authenticated browser و media live قابل اعتبارسنجی نیستند. ابتدا Docker را اجرا کنید و سپس bun run dev:api:local را دوباره اجرا کنید.

## مسیر اجرای کار

ترتیب کار از plan.md:

1. تثبیت قراردادها و مالکیت فایل‌ها
2. seed قابل reset و local environment
3. vertical slice از catalog تا order و مشاهده در admin
4. تکمیل account، return/refund، content و SEO
5. Demo staging gate
6. provider certification، backup/restore و Production gate

قبل از تغییر schema، public contract، permission یا state machine، ابتدا arch.md و ADRهای مرتبط را بررسی کنید.
