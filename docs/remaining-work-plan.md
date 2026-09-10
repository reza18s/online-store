# Plan

این سند برنامهٔ تکمیل NOVA بعد از baseline فعلی پروژه است. هدف، تبدیل قسمت‌های باقی‌مانده به تسک‌های کوچک، مستقل و قابل واگذاری است تا چند ایجنت بتوانند هم‌زمان روی شاخه‌های جدا کار کنند، هر کدام یک Pull Request باز کنند، و فقط بعد از review و validation وارد شاخهٔ اصلی شوند.

Baseline فعلی این برنامه commit e47d9a2 روی master است. در این baseline، foundation، بخش عمدهٔ API/domain، Prisma migrations و seed، catalog/search/facets، cart و merge، customer/staff auth backend، checkout/order/payment logic، inventory، coupons، notification outbox، fulfillment/returns، content/SEO API و لایه‌های transport مرورگر وجود دارد. داشبورد ادمین #admin و صفحهٔ محصولات #admin/products نیز با referenceهای موجود پیاده شده‌اند؛ اما بسیاری از صفحه‌های ادمین هنوز legacy/static هستند و providerهای واقعی، SSR/hybrid، E2E runtime، QA کامل بصری و launch readiness باقی مانده‌اند.

## Scope

- In:
  - تکمیل frontend واقعی و production-connected برای storefront، account، checkout و admin.
  - تکمیل API contract/OpenAPI، SSR/hybrid، sitemap، robots، structured data و content rendering.
  - اعتبارسنجی واقعی PostgreSQL 16، Redis، Prisma migrations، worker، integration و E2E.
  - اتصال امن providerهای واقعی فقط پس از انتخاب صریح provider و فراهم‌شدن credentialهای sandbox.
  - security review، observability، backup/restore، responsive/RTL/accessibility و release readiness.
  - branch مستقل و یک PR مستقل برای هر تسک اجرایی.

- Out:
  - تغییر سلیقه‌ای در domain model، money semantics، inventory reservation، payment state یا order state بدون ADR و approval.
  - تولید تصویر جایگزین برای صفحه‌هایی که reference ندارند.
  - قرار دادن credential، OTP، token، دادهٔ production یا فایل .env در repository.
  - merge کردن PR توسط agentهای فرعی؛ merge فقط با integration owner انجام می‌شود.
  - refactor سراسری apps/web/src/app.tsx یا اضافه‌کردن dependency جدید بدون دلیل و review.
  - launch واقعی، تغییر DNS، migration مخرب یا استفاده از credential production بدون تأیید جداگانهٔ صاحب پروژه.

## Action items

[ ] 1. ابتدا DB/Prisma، امنیت و contractها را به‌صورت موازی تثبیت و هر نتیجه را با PR مستقل review کن.

[ ] 2. بعد از ثابت‌شدن contractها، frontend foundation و route ownership را یک‌بار و به‌صورت sequential تثبیت کن تا agentهای صفحه روی یک فایل shared با هم تداخل نداشته باشند.

[ ] 3. لایهٔ staff session/MFA را تکمیل کن؛ سپس گروه‌های مستقل admin و storefront را در waveهای موازی اجرا کن.

[ ] 4. برای هر صفحه یا flow بصری جدید، قبل از کدنویسی از کاربر screenshot/reference دقیق، viewport و stateهای لازم را درخواست کن؛ تصویر جایگزین نساز.

[ ] 5. providerهای payment، SMS/notification، shipping و object storage را فقط پشت adapterهای موجود و پس از تصمیم provider به‌صورت موازی پیاده کن.

[ ] 6. SSR/SEO، worker/observability و integration/E2E را با ownership جدا اجرا و بعد از هر batch، typecheck/lint/test/build و runtime smoke را انجام بده.

[ ] 7. پس از اتمام featureها، QA کامل 1440/1280/1024/768/390/360، RTL، accessibility، state matrix و visual comparison را اجرا کن.

[ ] 8. در پایان security/performance/release audit، staging، backup/restore drill و controlled launch را فقط پس از برآورده‌شدن decision gateها انجام بده.

## وضعیت فعلی و قسمت‌های باقی‌مانده

### انجام‌شده یا دارای implementation قابل استفاده

- apps/api/src/modules/catalog: public catalog، search، suggestions، facets، admin catalog، lifecycle، variants، media، taxonomy و inventory-safe responses.
- apps/api/src/modules/auth و staff-auth: customer OTP/session، staff password/TOTP/session، role guards و CSRF boundary.
- apps/api/src/modules/cart، checkout، orders، payments، inventory، coupons: cart ownership/merge، quote، reservation، order snapshot، payment callback/reconciliation، refund، coupon و fulfillment rules.
- apps/api/src/modules/content: published content reads، SEO resolution و admin lifecycle برای content/SEO/redirect.
- apps/web/src/features/**: transport/query/mutationهای catalog، cart، auth، addresses، checkout، orders، admin modules و content.
- apps/web/src/app.tsx: home/category/PLP/search/PDP/cart/auth/account/address/checkout/order/return views، admin dashboard و admin products.
- packages/db/prisma: schema، شش migration و seed؛ packages/db/prisma.config.ts برای Prisma 7.10.
- apps/worker: notification outbox lease/retry loop و تست‌های آن.
- آخرین validation baseline: ۳۴۳ تست موفق، typecheck موفق، lint موفق و build موفق.

### باقی‌ماندهٔ اصلی

1. بیشتر صفحه‌های admin به‌جز dashboard و products هنوز در AdminLegacyPage یا preview/static state هستند: product create/edit، variants، media، categories، inventory، orders، order detail، payments، customers، notifications، audit و content.
2. staff login/MFA در مرورگر باید به session API واقعی متصل و route protection آن کامل شود.
3. صفحه‌های public content/policy و system states باید از content API واقعی استفاده کنند؛ preview data نباید مسیر production را تغذیه کند.
4. checkout و payment recovery باید همهٔ stateهای quote expired، stock conflict، price changed، pending، failed، cancelled، timeout و late callback را در UI واقعی نشان دهند.
5. SSR/hybrid rendering، initial HTML، canonical، sitemap، robots و structured data هنوز کامل نشده‌اند.
6. payment gateway، SMS، notification sender، shipping و object storage هنوز fail-closed یا local هستند و provider انتخاب نشده است.
7. exact PostgreSQL 16/Redis Docker validation، integration/E2E، CI، monitoring، backup/restore و rollback drill باید اجرا و مستند شوند.
8. screenshot QA در viewport دقیق 390/360 و visual coverage همهٔ screen/stateها تکمیل نشده است.
9. در apps/api/src/modules/orders/orders-admin.controller.ts یک security follow-up برای بررسی عدم exposure payment.redirectUrl در پاسخ order-admin لازم است؛ این مورد باید در PR مستقل SEC-001 بررسی شود.
10. opening status در arch.md نسبت به implementation فعلی عقب است؛ بعد از تثبیت coverage، مستندات status باید همگام شوند، بدون بازتعریف contractها.

## قواعد مشترک همهٔ agentها

### Branch و PR

- baseline فعلی master و commit e47d9a2 است. برای تسک وابسته، branch را از آخرین master بعد از merge شدن dependency بساز؛ هیچ agentی از branch unmerged agent دیگر branch نسازد.
- نام branch:
  - codex/<TASK-ID>-<short-slug>
  - مثال: codex/db-001-prisma-runtime
- قبل از تغییر:
  - git status --short
  - git branch --show-current
  - بررسی اینکه فایل‌های خارج از scope از قبل تغییر نکرده باشند.
- هر تسک دقیقاً یک branch و یک PR داشته باشد. PR را به branch integration فعلی، پیش‌فرض master، باز کن و merge نکن.
- اگر GitHub/remote برای agent در دسترس نبود، branch و commit را حفظ کن، متن کامل PR را در خروجی بده و صادقانه PR BLOCKED گزارش کن؛ ادعا نکن PR باز شده است.
- PR باید فقط یک ownership boundary را پوشش دهد؛ cleanup، formatting سراسری، dependency بی‌دلیل و تغییر فایل‌های تسک دیگر ممنوع است.

### Visual/reference gate

این قانون از طرف صاحب پروژه به‌صورت صریح روی دستور عمومی design-before-code اعمال شده است:

- برای هر صفحه، flow، state یا component family بصری جدید، ابتدا از کاربر screenshot/reference همان صفحه را بخواه.
- درخواست باید viewport و state را مشخص کند؛ مثلاً desktop 1440، tablet 768، mobile 390، loading، empty یا error.
- تا وقتی reference دریافت نشده، agent باید UI نهایی آن صفحه را متوقف و task را BLOCKED BY REFERENCE گزارش کند.
- agent حق ندارد با image generator یا هر روش دیگری تصویر جایگزین بسازد یا screenshot خیالی را source of truth قرار دهد.
- referenceهای موجود فقط برای stateهایی معتبرند که واقعاً پوشش می‌دهند: dashboard ادمین و products ادمین. برای routeهای دیگر دوباره reference لازم است.
- بعد از دریافت reference، آن را inspect کن، با Tailwind + primitives موجود پیاده کن، در همان viewportها render بگیر و comparison evidence را به PR اضافه کن.

### معماری و UI

- Tailwind CSS سیستم اصلی styling است؛ از tokenهای موجود و primitiveهای packages/ui استفاده کن.
- server state در TanStack Query بماند و state transient در Zustand/React state؛ raw API call داخل component پراکنده نشود.
- از CSS logical properties برای RTL استفاده کن. phone، SKU، order number، tracking number، URL، payment reference و coupon را در container مستقل dir="ltr" رندر کن.
- semantic HTML، heading order، keyboard navigation، focus-visible، WCAG 2.2 AA، reduced motion، touch target حداقل 44px، loading/empty/error/disabled/success و permission state الزامی است.
- Persian display text را تغییر نده؛ فقط direction و mixed LTR/Persian را درست کن.
- business rule را داخل primitive بصری قرار نده و mock/fixture/hard-coded preview را به‌جای production path معرفی نکن.

### Validation مشترک

هر agent باید متناسب با ریسک این بررسی‌ها را اجرا کند:

```powershell
bun run typecheck
bun run lint
bun test
bun run build
bun run docker:config
```

برای DB/API/worker:

```powershell
bun run db:generate
bunx prisma migrate deploy
bun run db:seed
```

برای integration/E2E، scriptهای test:integration و test:e2e را فقط وقتی اضافه کن که واقعاً harness ساخته شده باشد. اگر اجرای Bun داخل Codex sandbox به EPERM روی node_modules/.bun یا .git خورد، آن را با terminal محلی/CI تکرار و علت محیطی را از شکست کد جدا کن؛ هیچ check ناموفق را PASS اعلام نکن.

## Dependency graph و waveهای موازی

```text
BASELINE e47d9a2
       |
       +--> DB-001  Prisma/Postgres/Redis runtime
       +--> SEC-001 API/admin security boundary
       +--> API-001 API contract/OpenAPI/client parity
       +--> WEB-001 frontend ownership + Tailwind foundation
                          |
                          v
                    AUTH-001 staff session/MFA
                          |
       +------------------+-------------------+
       |                  |                   |
       v                  v                   v
 ADMIN-001..004     WEB-002..005        PROVIDER-001..004
       |                  |                   |
       +------------------+-------------------+
                          |
              SEO-001 / OPS-001 / OPS-002
                          |
                       TEST-001
                          |
                       QA-001
                          |
                       REL-001
                          |
                     LAUNCH-001
```

### Wave 0 — قابل اجرای موازی

- DB-001، SEC-001 و API-001 می‌توانند هم‌زمان اجرا شوند؛ هر کدام owner فایل جدا دارد.
- WEB-001 می‌تواند بعد از freeze شدن contract پایه شروع شود، اما نباید هم‌زمان با agent دیگری apps/web/src/app.tsx، packages/ui یا global styles را ویرایش کند.
- migration و تغییر package.json/lockfile را فقط یک agent در هر لحظه انجام دهد.

### Wave 1 — sequential foundation

- WEB-001 باید قبل از page-agentهای متعدد merge شود.
- AUTH-001 بعد از review امنیت و client contract و بعد از آماده‌شدن route ownership اجرا شود.
- اگر WEB-001 component ownership را کامل نکرد، تمام taskهایی که مجبور به تغییر app.tsx هستند sequential هستند، نه parallel.

### Wave 2 — parallel feature work

- ADMIN-001، ADMIN-002، ADMIN-003، ADMIN-004 بعد از AUTH-001 و دریافت referenceهای لازم هم‌زمان قابل اجرا هستند؛ هر کدام page/component directory مستقل داشته باشند.
- WEB-002، WEB-003، WEB-004، WEB-005 نیز بعد از WEB-001 و contractها هم‌زمان قابل اجرا هستند؛ route wiring مرکزی باید owner واحد داشته باشد.
- PROVIDER-001، PROVIDER-002، PROVIDER-003، PROVIDER-004 مستقل‌اند و پس از انتخاب provider/credential sandbox می‌توانند parallel باشند.

### Wave 3 و 4 — integration و release

- SEO-001، OPS-001 و OPS-002 با ownership جدا قابل موازی‌سازی‌اند، اما قبل از QA نهایی باید merge شوند.
- TEST-001 می‌تواند skeleton خود را زودتر بسازد، ولی نتیجهٔ نهایی آن بعد از contract/provider/UI merge اعتبار دارد.
- QA-001 بعد از feature merge، سپس REL-001 و بعد LAUNCH-001 sequential هستند.

## جدول تسک‌ها

| ID           | عنوان                                                                | نوع                            | وابستگی                               | Wave |
| ------------ | -------------------------------------------------------------------- | ------------------------------ | ------------------------------------- | ---- |
| DB-001       | Prisma، PostgreSQL 16، Redis و migration reproducibility             | high-risk backend/infra        | —                                     | 0    |
| SEC-001      | security boundary و redaction برای API/admin                         | high-risk security             | —                                     | 0    |
| API-001      | API contract، OpenAPI و client parity                                | high-risk contract             | —                                     | 0    |
| WEB-001      | route ownership، Tailwind tokens و shared UI foundation              | sequential frontend foundation | API-001                               | 0/1  |
| AUTH-001     | staff login، MFA، session bootstrap و route guard                    | auth/frontend                  | SEC-001، API-001، WEB-001             | 1    |
| ADMIN-001    | admin catalog، product editor، variants، media، taxonomy و inventory | admin UI                       | AUTH-001                              | 2    |
| ADMIN-002    | admin orders، fulfillment، shipment، returns و refunds               | admin UI                       | AUTH-001، API-001                     | 2    |
| ADMIN-003    | admin payments، customers، notifications و audit                     | admin UI                       | AUTH-001، SEC-001                     | 2    |
| ADMIN-004    | admin content، SEO metadata و redirects                              | admin UI                       | API-001                               | 2    |
| WEB-002      | storefront home/category/PLP/search/PDP/cart state completion        | storefront UI                  | WEB-001، API-001                      | 2    |
| WEB-003      | account، addresses، orders، tracking و returns                       | storefront UI                  | WEB-001، AUTH-001                     | 2    |
| WEB-004      | checkout، quote، conflict و payment recovery states                  | commerce UI                    | WEB-001، API-001                      | 2    |
| WEB-005      | content/policy pages و offline/error/maintenance states              | storefront/content UI          | WEB-001، API-001                      | 2    |
| PROVIDER-001 | payment gateway adapter                                              | provider/backend               | DB-001، API-001، gateway decision     | 2    |
| PROVIDER-002 | SMS و notification sender adapter                                    | provider/worker                | DB-001، provider decision             | 2    |
| PROVIDER-003 | shipping provider adapter                                            | provider/backend               | API-001، shipping policy              | 2    |
| PROVIDER-004 | S3-compatible media storage و upload pipeline                        | provider/backend               | DB-001، storage decision              | 2    |
| SEO-001      | SSR/hybrid، canonical، sitemap، robots و structured data             | architecture/SEO               | API-001، WEB-001                      | 3    |
| OPS-001      | notification worker، retry، observability و operational probes       | worker/ops                     | DB-001، PROVIDER-002                  | 3    |
| OPS-002      | CI، deployment config، monitoring، backup و restore drill            | infra/ops                      | DB-001، provider decisions            | 3    |
| TEST-001     | integration، E2E و concurrency harness                               | test/integration               | DB-001، API-001                       | 3    |
| QA-001       | responsive، RTL، accessibility، state matrix و visual regression     | QA                             | همهٔ UI/SEO taskها                    | 4    |
| REL-001      | security/performance/contract/release audit                          | release gate                   | TEST-001، QA-001، OPS-002             | 4    |
| LAUNCH-001   | staging، rollback، restore و controlled launch readiness             | release/ops                    | REL-001، providerها، تصمیم‌های launch | 5    |

## متن مشترک آماده برای ابتدای prompt همهٔ agentها

این متن را به ابتدای prompt تسک مربوط اضافه کن:

```text
You are the implementation owner for the bounded NOVA task named <TASK-ID>.

Repository:
C:\Users\Asus\Documents\ChatGPT\online store

Base:
Start from the latest integration branch. It is currently master; after dependencies merge, use the latest master, not an unmerged agent branch.

Before editing:
1. Read README.md, arch.md, the relevant parts of AGENT_MERGED.md, and only the source files in your task scope.
2. Run git status --short and preserve all pre-existing changes.
3. Create exactly one branch named codex/<TASK-ID>-<short-slug>.
4. Do not modify files outside the allowed scope unless you stop and report a BOUNDARY ISSUE.

Engineering rules:
- Follow the existing Bun 1.3.4 workspace, React/Vite, NestJS, Prisma/PostgreSQL, Redis, TanStack Query, Tailwind CSS and packages/ui conventions.
- Reuse existing production paths and contracts. Do not create duplicate state, API clients, design systems or mock completion.
- Keep Persian text and RTL behavior correct. Isolate mixed LTR values such as phone, SKU, order number, tracking number, URL and payment reference.
- Do not add a dependency, schema change, migration, provider or public API breaking change without a concrete reason and explicit report.
- Add or update behavior tests where the task changes behavior.

Visual gate:
- For every new visual page, flow, state or component family, ask the user for the exact screenshot/reference, target viewport and required state before implementing the visual UI.
- Do not generate a substitute image, use image generation, or invent a page reference.
- If the reference is missing, implement only safe non-visual contract/test work, then return BLOCKED BY REFERENCE for the visual part.
- When a reference exists, inspect it first and implement with Tailwind and existing shared primitives. Include comparison evidence in the PR.

Validation:
Run the narrowest relevant checks and, before PR, run:
bun run typecheck
bun run lint
bun test
bun run build
bun run docker:config
For DB work also run the documented migration/seed checks. Report sandbox EPERM separately from code failures; never call an unrun or failed check PASS.

Git/PR:
- Make one focused commit on your task branch.
- Open one PR targeting the current integration branch; do not merge it.
- If remote/PR access is unavailable, leave the branch and commit intact, provide the exact PR title/body, and report PR BLOCKED.
- Do not rebase away or overwrite other agents' work.

Return exactly:
STATUS: completed | partial | blocked | failed
SUMMARY:
FILES CHANGED:
IMPLEMENTATION DETAILS:
TESTS / QA:
VALIDATION RUN:
VALIDATION RESULT:
ARCHITECTURE IMPACT:
ASSUMPTIONS:
RISKS / FOLLOW-UP:
PR:
BOUNDARY ISSUES:
```

## متن آمادهٔ هر تسک

### DB-001 — Prisma/PostgreSQL 16/Redis runtime

```text
TASK ID: DB-001
TASK TITLE: Make Prisma and local infrastructure reproducible

OBJECTIVE:
Prove and document that a clean machine can start the exact PostgreSQL 16 and Redis Compose services, generate Prisma client, deploy all migrations in order, seed the catalog, and pass readiness checks.

WHY:
The current code has migrations and seed, but the exact PostgreSQL 16 prisma migrate deploy path and clean Docker workflow still need evidence. A PostgreSQL 18 disposable smoke is not a substitute for the repository's declared PostgreSQL 16 image.

ALLOWED FILES / SCOPE:
- packages/db/prisma/**
- packages/db/prisma.config.ts
- packages/db/package.json only for safe migration/seed script corrections
- infra/docker/**
- docs/runbooks/local-development.md
- root package.json only if a documented deploy script is genuinely needed
- focused DB/infrastructure tests and CI checks

DO NOT TOUCH:
- product/order/payment domain semantics
- frontend pages
- provider adapters
- unrelated lockfile changes
- destructive commands against an existing user database

IMPLEMENTATION REQUIREMENTS:
- Validate docker compose --env-file .env.example -f infra/docker/compose.yml config.
- Start the exact postgres:16-alpine and redis:7-alpine services in an isolated local environment.
- Run bun run db:generate, bunx prisma migrate deploy, and bun run db:seed.
- Verify migration history, seed counts, /health/live, /health/ready, and Redis connectivity where the app uses it.
- If Docker Hub/proxy or local permissions block the exact image, report BLOCKED with the exact evidence; do not silently substitute another major version.
- Keep local credentials in .env.example only as non-production examples.

ACCEPTANCE CRITERIA:
- Clean documented workflow succeeds, or a reproducible external blocker is recorded.
- No migration is reordered, deleted or made destructive without ADR and review.
- Prisma config and seed command work with the declared version.

BRANCH:
codex/db-001-prisma-runtime

PR TITLE:
chore(DB-001): verify Prisma and local runtime workflow
```

### SEC-001 — API/admin security boundary

```text
TASK ID: SEC-001
TASK TITLE: Audit and harden API and admin response boundaries

OBJECTIVE:
Perform a bounded security review of customer/staff/admin authentication, authorization, CSRF, error envelopes and sensitive response fields, then fix only validated findings in this boundary.

WHY:
Admin order responses require a specific follow-up to verify that payment.redirectUrl is not exposed where it is unnecessary. The project also requires deny-by-default roles, bounded errors, no raw provider payloads and no credential leakage.

ALLOWED FILES / SCOPE:
- apps/api/src/common/http/**
- apps/api/src/modules/auth/**
- apps/api/src/modules/staff-auth/**
- apps/api/src/modules/orders/orders-admin.controller.ts and focused order-admin tests
- apps/api/src/modules/payments/** only for response-redaction tests if needed
- a focused ADR/security note only when a durable decision changes

DO NOT TOUCH:
- payment provider implementation
- database schema/migrations
- frontend layout
- unrelated order business rules
- production credentials

IMPLEMENTATION REQUIREMENTS:
- Verify customer cannot reach staff context and staff role checks remain deny-by-default.
- Verify CSRF exact-origin/double-submit behavior for state-changing requests.
- Verify error details are bounded and provider/raw payloads, OTPs, session secrets and payment redirect/raw data are not exposed in the wrong response.
- Inspect and, if demonstrated, redact payment.redirectUrl from admin order responses while preserving the dedicated payment inspection contract.
- Add regression tests for every changed boundary and record any non-blocking finding without silently fixing unrelated issues.

ACCEPTANCE CRITERIA:
- No validated sensitive-field exposure remains in the scoped admin responses.
- Existing auth/CSRF/role tests still pass.
- No public contract is weakened and no raw provider payload is returned.

BRANCH:
codex/sec-001-api-admin-boundary

PR TITLE:
fix(SEC-001): harden API and admin response boundaries
```

### API-001 — API contract/OpenAPI/client parity

```text
TASK ID: API-001
TASK TITLE: Stabilize API contracts and generated/client parity

OBJECTIVE:
Audit the current Nest controllers, DTOs, error envelope and @nova/api-client, then add the smallest maintainable OpenAPI/contract artifact and automated parity checks needed by frontend and integration agents.

WHY:
The domain APIs and typed browser transports exist, but parallel agents need one stable producer/consumer contract. The architecture requires OpenAPI and a generated or demonstrably synchronized client boundary.

ALLOWED FILES / SCOPE:
- packages/api-client/**
- apps/api/src/** DTO/controller metadata required for the contract
- OpenAPI source/spec and its focused validation
- package scripts required to validate the contract
- relevant ADR/docs

DO NOT TOUCH:
- UI page composition
- Prisma schema or migration SQL
- provider SDKs
- unrelated business logic

IMPLEMENTATION REQUIREMENTS:
- Inventory the current /v1 routes and stable error envelope.
- Document request/response types, auth requirements, pagination, idempotency and error codes used by customer/admin flows.
- Keep public changes additive or explicitly versioned; do not silently break current consumers.
- If generation is introduced, edit its source of truth and review generated output; do not hand-edit generated output as the primary source.
- Add contract tests for catalog facets, cart merge conflict, checkout, customer orders, admin orders/payments/content and health.

ACCEPTANCE CRITERIA:
- Frontend agents can consume one stable, reviewable contract.
- API client types and runtime paths agree.
- Contract validation is runnable in local/CI workflow.

BRANCH:
codex/api-001-contract-parity

PR TITLE:
feat(API-001): stabilize API contract and client parity
```

### WEB-001 — frontend ownership/Tailwind foundation

```text
TASK ID: WEB-001
TASK TITLE: Establish safe frontend page ownership and shared UI foundation

OBJECTIVE:
Reduce conflict risk around the large apps/web/src/app.tsx without a broad rewrite, and stabilize only the shared Tailwind/UI primitives required by the remaining pages.

WHY:
Parallel page agents must not edit the same monolithic route file, global styles or shared primitive simultaneously. Existing dashboard/products visual behavior must remain intact.

ALLOWED FILES / SCOPE:
- apps/web/src/app.tsx
- apps/web/src/styles.css
- packages/ui/**
- tailwind.config.cjs
- narrowly related frontend tests and route helpers

DO NOT TOUCH:
- API/domain logic
- Prisma/migrations
- provider adapters
- redesign of already-approved dashboard/products screens
- unrelated dependency upgrades

IMPLEMENTATION REQUIREMENTS:
- Identify a route/page ownership boundary that lets later agents add page-local components under apps/web/src/features/** or an equivalent existing boundary.
- Extract only code with clear ownership; preserve runtime behavior and URLs.
- Consolidate duplicated tokens/utility decisions into existing Tailwind/CSS token authority.
- Preserve RTL, mixed-direction values, existing supplied admin references, loading/error/empty primitives and reduced-motion behavior.
- Add focused route/render tests if extraction changes wiring.

ACCEPTANCE CRITERIA:
- Existing storefront, #admin and #admin/products behavior remains reachable.
- Later agents have non-overlapping page-local ownership.
- No second styling framework or duplicate design system is introduced.

BRANCH:
codex/web-001-frontend-foundation

PR TITLE:
refactor(WEB-001): establish frontend ownership boundaries
```

### AUTH-001 — staff login/MFA/session guard

```text
TASK ID: AUTH-001
TASK TITLE: Connect staff authentication and protected admin routing

OBJECTIVE:
Add the browser transport and session lifecycle for staff password/TOTP authentication, logout, session expiry and protected admin routes using the existing backend contracts.

WHY:
The staff-auth backend exists, but admin pages must not rely on static preview state or an unprotected route. Customer and staff sessions must remain separate.

ALLOWED FILES / SCOPE:
- apps/web/src/features/auth/** or the established admin auth feature boundary
- apps/web/src/features/admin/** session/guard helpers
- route wiring created by WEB-001
- packages/api-client/** only if API-001 leaves a proven contract gap
- focused auth/session tests

DO NOT TOUCH:
- staff password/TOTP cryptography
- customer OTP policy
- admin visual page families beyond auth state
- product/order business logic

IMPLEMENTATION REQUIREMENTS:
- Use opaque staff session behavior from the API; never store plaintext password, OTP or TOTP secret.
- Handle invalid credentials, rate limit, account lock, MFA required, MFA invalid, session expiry, logout and permission denied.
- Keep admin query/cache state isolated from customer state.
- For a new admin login screen, request the exact user-supplied reference and viewport before final visual code; do not generate one.

ACCEPTANCE CRITERIA:
- Unauthenticated admin routes redirect to real admin login.
- Successful password+MFA flow establishes the correct staff session.
- Logout/session expiry removes protected data and does not expose customer data.
- Focused auth/route/cache tests pass.

BRANCH:
codex/auth-001-staff-session

PR TITLE:
feat(AUTH-001): connect staff MFA session and admin route guard
```

### ADMIN-001 — admin catalog/inventory

```text
TASK ID: ADMIN-001
TASK TITLE: Implement production-connected admin catalog and inventory pages

OBJECTIVE:
Replace the remaining static admin catalog/inventory routes with real page-local UI for product create/edit, variants, media, categories, inventory and stock movements.

WHY:
The APIs and browser transport hooks already exist; operators need to manage the catalog without editing the database directly.

ALLOWED FILES / SCOPE:
- page-local files under apps/web/src/features/admin/** for catalog/inventory
- apps/web/src/features/admin/admin-catalog-api.ts
- apps/web/src/features/admin/admin-inventory-api.ts
- focused route registration owned by WEB-001, only if coordinated
- focused tests and design-qa.md evidence

DO NOT TOUCH:
- Prisma schema/API domain rules unless a contract bug is proven
- admin orders/payments/content page families
- shared app.tsx/global tokens without integration-owner coordination
- generated images or invented reference screens

IMPLEMENTATION REQUIREMENTS:
- Before visual implementation, ask the user for reference images for each missing page and exact target viewports/states.
- Use real admin catalog/inventory hooks, optimistic updatedAt handling, lifecycle validation, role/permission errors and retry states.
- Cover draft/invalid/saving/saved/publish-blocked, media upload failure, low stock, discrepancy, empty and table error states.
- Reuse Tailwind and shared primitives; preserve the approved dashboard/products reference language without assuming it applies to every page.

ACCEPTANCE CRITERIA:
- Product, variant, media, taxonomy and inventory actions reach the real API.
- No static preview is used when a staff session is available.
- Missing references are reported as BLOCKED BY REFERENCE, not filled with generated visuals.

BRANCH:
codex/admin-001-catalog-inventory

PR TITLE:
feat(ADMIN-001): connect admin catalog and inventory workflows
```

### ADMIN-002 — admin orders/fulfillment/returns/refunds

```text
TASK ID: ADMIN-002
TASK TITLE: Implement admin order operations

OBJECTIVE:
Build real admin order list/detail, fulfillment, shipment/tracking, return review and refund action pages on top of existing APIs.

WHY:
Phase 5 requires an operator to process an order without direct database edits, including safe state transitions and support handoffs.

ALLOWED FILES / SCOPE:
- page-local apps/web/src/features/admin/** order/fulfillment/returns/refund components
- apps/web/src/features/admin/admin-orders-api.ts
- focused UI tests and visual QA notes

DO NOT TOUCH:
- payment provider adapter
- admin catalog/content page families
- order domain transitions or database schema
- shared route files without coordination

IMPLEMENTATION REQUIREMENTS:
- Ask the user for exact references for orders list, order detail, return detail and refund states before new visual UI.
- Use real pagination/search/status filters, role-aware actions, optimistic concurrency and stable error codes.
- Display immutable order/address/product snapshots safely; do not expose redirect/raw provider payload.
- Cover paid/pending/preparing/shipped/delayed/exception/delivered/cancelled/returned and refund pending/failed/success.
- Require confirmation and clear reason input for consequential actions.

ACCEPTANCE CRITERIA:
- Authorized operations staff can advance fulfillment and shipment through real API calls.
- Support/admin can review returns and refunds with safe error/retry states.
- Unauthorized and stale-version actions are rejected in UI and remain auditable.

BRANCH:
codex/admin-002-orders-operations

PR TITLE:
feat(ADMIN-002): implement admin order operations workflows
```

### ADMIN-003 — admin payments/customers/notifications/audit

```text
TASK ID: ADMIN-003
TASK TITLE: Implement support and finance inspection pages

OBJECTIVE:
Connect admin payment inspection, customer lookup/detail, notification delivery inspection and audit log screens to their existing redacted APIs.

WHY:
Operations needs safe visibility into payment mismatches, customer context, delivery failures and audit history without exposing secrets or raw provider payloads.

ALLOWED FILES / SCOPE:
- page-local apps/web/src/features/admin/** for payments/customers/notifications/audit
- admin-payments-api.ts
- admin-customers-api.ts
- admin-notifications-api.ts
- admin-audit-api.ts
- focused tests and visual QA notes

DO NOT TOUCH:
- payment gateway implementation
- customer/staff identity model
- notification provider credentials
- admin orders/catalog page families

IMPLEMENTATION REQUIREMENTS:
- Ask for page/state references before visual implementation.
- Use bounded pagination, filters, permission denied, table loading/empty/error and session expiry states.
- Preserve redaction guarantees: no raw callback payload, secret, OTP, provider credential, notification job internals or unnecessary PII.
- Make links to related orders/customer records safe and encoded.

ACCEPTANCE CRITERIA:
- Staff with the appropriate read roles can inspect the intended data.
- Support staff cannot see operations-only notification/payment data.
- All list/detail/error states are production-connected and tested.

BRANCH:
codex/admin-003-support-finance

PR TITLE:
feat(ADMIN-003): connect admin support and finance inspection
```

### ADMIN-004 — admin content/SEO/redirects

```text
TASK ID: ADMIN-004
TASK TITLE: Implement admin content and SEO management

OBJECTIVE:
Build the real admin UI for content pages, SEO metadata and redirects using the existing draft-first, audited, optimistic-concurrency APIs.

WHY:
Content API boundaries exist, but admin operators need to create, edit, publish and safely redirect content without database access.

ALLOWED FILES / SCOPE:
- page-local apps/web/src/features/admin/** content/SEO/redirect components
- apps/web/src/features/content/content-api.ts
- focused tests and docs/design QA evidence

DO NOT TOUCH:
- SSR implementation
- public content visual pages
- database schema unless a contract gap is proven
- external CMS integration

IMPLEMENTATION REQUIREMENTS:
- Ask for references for content editor, SEO list/detail and redirect screens.
- Respect draft-first status transitions, usable-content-before-publish, slug policy, site-relative destinations, cycle rejection and updatedAt concurrency.
- Provide saving/saved/validation/publish-blocked/permission/error/empty states.
- Keep JSON content blocks bounded and typed; do not render unsafe HTML.

ACCEPTANCE CRITERIA:
- Admin can manage content/SEO/redirect records through real API calls.
- Publish and redirect errors are understandable and do not lose unsaved edits.
- Mutations are audited and stale editors receive a recoverable conflict.

BRANCH:
codex/admin-004-content-seo

PR TITLE:
feat(ADMIN-004): implement admin content and SEO workflows
```

### WEB-002 — storefront catalog/discovery/cart

```text
TASK ID: WEB-002
TASK TITLE: Complete storefront discovery and cart states

OBJECTIVE:
Finish production-connected home/category/PLP/search/PDP/cart behavior, especially dynamic facets, suggestion navigation, sale/compare-at safety, and failure states.

WHY:
The core catalog vertical slice exists, but visual and state coverage must be complete and must never fall back to hard-coded product truth.

ALLOWED FILES / SCOPE:
- page-local apps/web/src/features/catalog/** and cart components
- apps/web/src/features/catalog/catalog-api.ts
- apps/web/src/features/cart/cart-api.ts
- route-local wiring coordinated through WEB-001
- focused UI/API tests and visual QA

DO NOT TOUCH:
- catalog database/domain rules
- checkout/order logic
- global design foundation

IMPLEMENTATION REQUIREMENTS:
- Ask for missing PLP/PDP/cart references and viewports before visual changes.
- Use server facets contextual to query, preserve stale selected values, and keep inventory quantities private.
- Cover loading, slow network, empty/no results, request failure, offline, variant not selected, low/out of stock, price changed, cart stock conflict, coupon success/error and recalculating.
- Preserve Persian normalization, compare-at invariant, URL state and real query cache invalidation.

ACCEPTANCE CRITERIA:
- Catalog and cart read/write paths use real API data.
- URL filters/sort/pagination are shareable and do not create duplicate requests.
- All critical states are keyboard-accessible and RTL-safe.

BRANCH:
codex/web-002-discovery-cart

PR TITLE:
feat(WEB-002): complete storefront discovery and cart states
```

### WEB-003 — account/orders/tracking/returns

```text
TASK ID: WEB-003
TASK TITLE: Complete customer account and order journeys

OBJECTIVE:
Finish customer account dashboard, profile/address management, order history/detail, tracking and return-request/status flows against real customer-scoped APIs.

WHY:
The transport and several screens exist, but account/order pages still need complete state handling, identity isolation and visual coverage.

ALLOWED FILES / SCOPE:
- page-local apps/web/src/features/account/** or existing account/address/order boundaries
- apps/web/src/features/addresses/**
- apps/web/src/features/orders/orders-api.ts
- route-local wiring coordinated through WEB-001
- focused tests and visual QA notes

DO NOT TOUCH:
- staff/admin pages
- customer auth backend policy
- order state machine
- payment provider

IMPLEMENTATION REQUIREMENTS:
- Ask for exact references for account, addresses, order detail, tracking and returns states.
- Cover authenticated default/loading/empty/error/offline/permission/session-expired/success states.
- Keep customer ownership enforced by server responses; never display another customer's order or cached cart.
- Use LTR isolation for order/tracking/phone/payment references and preserve Persian copy.

ACCEPTANCE CRITERIA:
- Customer can list/detail orders, manage addresses and submit eligible returns through real APIs.
- Delivered/expired/ineligible return cases are clear and safe.
- Logout, customer switch and session expiry clear protected cache correctly.

BRANCH:
codex/web-003-account-orders

PR TITLE:
feat(WEB-003): complete customer account and order journeys
```

### WEB-004 — checkout/payment recovery

```text
TASK ID: WEB-004
TASK TITLE: Complete checkout and payment recovery states

OBJECTIVE:
Make address, shipping, quote, coupon, payment and confirmation routes fully production-connected and explicit about every commerce failure/recovery state.

WHY:
Checkout is the highest-risk user flow. The backend has authoritative quote/idempotency/reservation/payment boundaries, but the browser must expose conflicts and recovery without pretending that an unconfigured provider succeeded.

ALLOWED FILES / SCOPE:
- page-local apps/web/src/features/checkout/** and checkout components
- existing checkout route wiring coordinated through WEB-001
- focused checkout/cart query tests and visual QA

DO NOT TOUCH:
- payment gateway/provider implementation
- inventory transaction rules
- customer address backend

IMPLEMENTATION REQUIREMENTS:
- Ask for references for address, shipping, payment-ready, pending, failed, cancelled, timeout, recovery and confirmation states.
- Use authoritative quote responses, stable idempotency keys, coupon normalization and server errors.
- Cover saved/new address, invalid address, unsupported region, shipping unavailable, quote expired, stock conflict, price changed, offline, processing and redirecting.
- Keep the local payment adapter fail-closed; do not show a fake paid success.
- Restore a recoverable payment/order path from query parameters without duplicating order submission.

ACCEPTANCE CRITERIA:
- Duplicate submit/callback cannot create duplicate order/payment from the browser.
- Every failed/pending/cancelled/timeout state has a safe next action.
- Confirmation renders only from authoritative order data.

BRANCH:
codex/web-004-checkout-recovery

PR TITLE:
feat(WEB-004): complete checkout and payment recovery states
```

### WEB-005 — content/policy/system states

```text
TASK ID: WEB-005
TASK TITLE: Connect public content and system states

OBJECTIVE:
Replace public editorial/policy preview content with published content API reads where available, and complete not-found, error, offline and maintenance states.

WHY:
Content/SEO APIs are implemented, but public rendering and system behavior must use production contracts and remain useful on slow/offline/error paths.

ALLOWED FILES / SCOPE:
- page-local apps/web/src/features/content/** and system-state components
- apps/web/src/features/content/content-api.ts
- route-local wiring coordinated through WEB-001
- focused rendering/transport tests and visual QA

DO NOT TOUCH:
- admin content editor
- SSR infrastructure beyond the public data contract
- generated or invented page images

IMPLEMENTATION REQUIREMENTS:
- Ask for references for each new public content/policy/system page and required viewport/state.
- Render only published content blocks from the API; handle missing/unpublished pages safely.
- Cover not found, API error, offline, maintenance, loading and retry states with accessible actions.
- Keep links site-relative/encoded and preserve canonical path semantics for SEO-001.

ACCEPTANCE CRITERIA:
- Public content pages no longer depend on fake preview data when published API content exists.
- Error/offline/maintenance routes are reachable and usable with keyboard/RTL.
- No unsafe HTML or unbounded content rendering is introduced.

BRANCH:
codex/web-005-content-system

PR TITLE:
feat(WEB-005): connect public content and system states
```

### PROVIDER-001 — payment gateway

```text
TASK ID: PROVIDER-001
TASK TITLE: Implement the selected Iranian payment adapter

OBJECTIVE:
Implement one selected payment provider behind the existing PaymentGateway interface, including start, callback verification, refund and timeout/reconciliation behavior.

BLOCKING INPUT:
The user must select the provider and provide sandbox documentation/credentials outside the repository. Do not choose a vendor by assumption.

ALLOWED FILES / SCOPE:
- apps/api/src/modules/checkout/payment.gateway.ts only for interface gaps
- provider-specific adapter directory
- payments/checkout integration wiring
- provider-focused tests, fixtures with redacted fake values and ADR
- env schema/example names without real values

DO NOT TOUCH:
- money semantics outside the adapter
- order/inventory transaction rules
- production credentials
- unrelated frontend UI

IMPLEMENTATION REQUIREMENTS:
- Convert integer toman to provider amount only inside the adapter and record provider unit.
- Verify signatures/provider identifiers, reject altered payloads, deduplicate callback event IDs and support late callback/refund reconciliation.
- Never log raw payloads or secrets.
- Add sandbox contract tests for success/failure/cancel/timeout/duplicate/invalid signature/refund failure.

ACCEPTANCE CRITERIA:
- Adapter is replaceable and does not leak SDK types into domain code.
- Existing payment service tests remain valid.
- Provider failure is observable and fail-closed.

BRANCH:
codex/provider-001-payment

PR TITLE:
feat(PROVIDER-001): add selected payment gateway adapter
```

### PROVIDER-002 — SMS/notification sender

```text
TASK ID: PROVIDER-002
TASK TITLE: Implement selected SMS and notification delivery adapters

OBJECTIVE:
Connect customer OTP delivery and notification outbox jobs to the selected provider while preserving the existing cooldown, retry, lease, dedupe and redaction rules.

BLOCKING INPUT:
The user must select an SMS/notification provider and provide sandbox documentation/credentials outside Git.

ALLOWED FILES / SCOPE:
- apps/api/src/modules/auth/otp-delivery.ts and provider adapter boundary
- apps/worker/src/notification-worker.ts provider integration boundary
- provider-specific adapter files
- env validation, tests and runbook updates

DO NOT TOUCH:
- OTP storage/security semantics
- order/payment business rules
- raw recipient/provider payload logging
- frontend layout

IMPLEMENTATION REQUIREMENTS:
- Never return OTP from API or store it in browser state.
- Keep provider errors bounded and secret-free.
- Preserve idempotent notification dedupe, lease/retry/terminal failure behavior.
- Add sandbox tests for provider timeout, retry, duplicate send protection and permanent failure.

ACCEPTANCE CRITERIA:
- OTP and payment notifications reach the selected adapter through real runtime wiring.
- Worker metrics/logs expose stable outcome codes only.
- Unconfigured provider remains fail-closed.

BRANCH:
codex/provider-002-sms-notifications

PR TITLE:
feat(PROVIDER-002): add SMS and notification delivery adapters
```

### PROVIDER-003 — shipping

```text
TASK ID: PROVIDER-003
TASK TITLE: Implement the selected shipping adapter and policy

OBJECTIVE:
Replace or extend the local fixed shipping policy with the selected shipping provider behind ShippingProvider, including quote, delivery estimate and tracking contract where supported.

BLOCKING INPUT:
The user must decide the shipping provider, supported provinces, price policy, return-shipping policy and sandbox/test mode.

ALLOWED FILES / SCOPE:
- apps/api/src/modules/checkout/shipping.provider.ts
- provider-specific shipping adapter
- checkout/order shipment wiring only where contract requires it
- tests, env validation, ADR/runbook

DO NOT TOUCH:
- payment/inventory logic
- unrelated admin UI
- hard-coded nationwide promise without product decision

IMPLEMENTATION REQUIREMENTS:
- Keep provider details behind the interface.
- Validate province/method/amounts and bound timeouts/errors.
- Preserve authoritative quote recalculation at checkout.
- Add tests for unavailable region, provider timeout, changed price, standard/express and tracking failure.

ACCEPTANCE CRITERIA:
- Checkout can quote through the selected adapter or fail safely.
- Provider monetary units and labels do not leak into domain semantics.
- Local fixed policy remains available only as an explicit local/test adapter.

BRANCH:
codex/provider-003-shipping

PR TITLE:
feat(PROVIDER-003): add selected shipping provider adapter
```

### PROVIDER-004 — object storage/media pipeline

```text
TASK ID: PROVIDER-004
TASK TITLE: Implement secure S3-compatible media storage

OBJECTIVE:
Connect admin media records to selected S3-compatible storage with safe upload, validation, alt text, primary-image rules and responsive derivative handling.

BLOCKING INPUT:
The user must select storage ownership/region/bucket policy and provide sandbox access outside Git.

ALLOWED FILES / SCOPE:
- catalog media service/controller boundary
- provider-specific storage adapter
- admin media transport if a contract gap is proven
- env validation, media tests and runbook

DO NOT TOUCH:
- product lifecycle rules except required media integration
- arbitrary public upload endpoints
- production keys

IMPLEMENTATION REQUIREMENTS:
- Validate MIME, size, extension, dimensions and safe object key ownership.
- Use signed/short-lived operations where appropriate; do not expose storage credentials.
- Keep primary-image deletion safeguards and alt text requirements.
- Test upload failure, orphan cleanup, duplicate request and derivative failure.

ACCEPTANCE CRITERIA:
- Admin media UI can use the real storage adapter after its page PR lands.
- Public URLs are safe and cacheable without exposing private bucket credentials.
- Storage outage fails safely and leaves database/media state consistent.

BRANCH:
codex/provider-004-media-storage

PR TITLE:
feat(PROVIDER-004): connect secure object storage media pipeline
```

### SEO-001 — SSR/hybrid and indexability

```text
TASK ID: SEO-001
TASK TITLE: Add the smallest production-compatible SSR/hybrid SEO path

OBJECTIVE:
Define and implement the minimum SSR/prerender/hybrid path compatible with the current React/Vite app so important public routes expose useful initial HTML and consistent metadata.

WHY:
The architecture requires indexable home/category/product/content pages, but the current app is primarily a Vite client shell.

ALLOWED FILES / SCOPE:
- Vite/server entry and route rendering files
- apps/web/src/features/content/content-api.ts integration where needed
- sitemap/robots/structured-data source
- deployment/runbook and one ADR for the selected rendering strategy
- focused SSR/metadata tests

DO NOT TOUCH:
- payment/checkout domain logic
- admin page visual redesign
- unrelated build tooling

IMPLEMENTATION REQUIREMENTS:
- Choose the smallest reversible approach; do not perform a framework rewrite by preference.
- Use the same catalog/content truth as the API and GET /v1/seo/resolve.
- Implement canonical URLs, redirect handling, title/description/OG data, JSON-LD for product/category/content where appropriate, robots.txt, XML sitemap and safe empty/error behavior.
- Prevent duplicate metadata between server and client hydration.
- Document cache invalidation/revalidation and non-indexable private routes.

ACCEPTANCE CRITERIA:
- Home, category, product and published content routes have useful initial HTML/metadata in the chosen runtime.
- Canonical/redirect/sitemap/robots outputs are deterministic and tested.
- No large unreviewed SSR rewrite or breaking client route behavior is introduced.

BRANCH:
codex/seo-001-ssr-indexability

PR TITLE:
feat(SEO-001): add hybrid rendering and indexability foundation
```

### OPS-001 — worker and operational probes

```text
TASK ID: OPS-001
TASK TITLE: Harden notification worker operations

OBJECTIVE:
Make the notification worker observable and safe in production-like operation, while keeping provider implementation owned by PROVIDER-002.

ALLOWED FILES / SCOPE:
- apps/worker/src/**
- worker package scripts/config
- health/metrics/logging integration only where the worker owns it
- worker tests and runbook

DO NOT TOUCH:
- SMS provider SDK implementation
- payment/order domain
- frontend
- database schema unless a proven worker index is required and separately reviewed

IMPLEMENTATION REQUIREMENTS:
- Preserve lease, retry delay, max attempts, idempotency and terminal failure semantics.
- Add stable counters/outcome logs for claimed/sent/retried/failed without sensitive job fields.
- Handle SIGINT/SIGTERM, DB disconnect, unhandled tick failure and backpressure safely.
- Add a smoke command or documented worker health check.

ACCEPTANCE CRITERIA:
- Worker starts, processes the real outbox path, retries safely and shuts down cleanly.
- Provider errors do not leak secrets.
- Tests cover duplicate workers, lease expiry and terminal failure behavior.

BRANCH:
codex/ops-001-worker-observability

PR TITLE:
feat(OPS-001): harden notification worker operations
```

### OPS-002 — CI/deployment/backup/monitoring

```text
TASK ID: OPS-002
TASK TITLE: Add release infrastructure and recovery evidence

OBJECTIVE:
Document and automate CI checks, staging configuration, health probes, monitoring/alerts, database/media backup ownership and restore/rollback drills.

ALLOWED FILES / SCOPE:
- .github/workflows/** or the repository's actual CI location
- infra/deploy/**
- infra/monitoring/**
- infra/docker/** only for deployment-safe corrections
- runbooks and environment validation

DO NOT TOUCH:
- production credentials
- live DNS/hosting changes without approval
- domain/payment/provider selection
- business logic

IMPLEMENTATION REQUIREMENTS:
- CI must run typecheck, lint, tests, build, Docker config and relevant migration checks.
- Define /health/live and /health/ready probe semantics without making optional providers incorrectly remove service readiness.
- Define encrypted DB/media backup, retention, ownership, restore verification, rollback and provider-failure runbooks.
- Add alerts for old pending payments, failed/refund backlog, notification failures, reservation expiry, backup age and readiness failure.
- Execute a restore drill in an isolated environment; documentation alone is not evidence.

ACCEPTANCE CRITERIA:
- A clean PR gets reproducible CI feedback.
- Restore and rollback steps are executable and evidence-backed.
- No secret or irreversible production action is embedded in the repository.

BRANCH:
codex/ops-002-ci-recovery

PR TITLE:
chore(OPS-002): add CI and recovery readiness
```

### TEST-001 — integration/E2E/concurrency

```text
TASK ID: TEST-001
TASK TITLE: Build the runtime commerce test harness

OBJECTIVE:
Add integration and E2E coverage for the real API/web/runtime paths and the critical commerce race/error matrix defined in arch.md.

ALLOWED FILES / SCOPE:
- test/integration/**, test/e2e/** or the repository's established test locations
- root test scripts/config
- focused fixtures/fake adapters explicitly used for isolated tests
- test-only Docker setup

DO NOT TOUCH:
- production domain behavior except test seams required for injection
- real credentials
- visual redesign

IMPLEMENTATION REQUIREMENTS:
- Start exact Postgres 16/Redis test dependencies where available.
- Cover draft/public catalog, search/facets, cart/merge, reservation/final-stock race, checkout idempotency, price/stock conflict, payment success/failure/cancel/timeout/duplicate/delayed/late callback/refund, order transitions, OTP/staff MFA/CSRF/roles and notifications.
- Use fake providers for deterministic integration tests and add separate sandbox smoke hooks for real providers.
- Add Playwright/browser journeys for home/category/search/PDP/cart/auth/account/checkout/order/admin critical paths.
- Make tests isolate data, clean up safely and report unavailable external services as BLOCKED.

ACCEPTANCE CRITERIA:
- Root exposes test:integration and test:e2e only when the corresponding harness exists.
- Critical races and duplicate operations have executable coverage.
- Browser tests assert real runtime wiring, not only component existence.

BRANCH:
codex/test-001-commerce-e2e

PR TITLE:
test(TEST-001): add commerce integration and E2E harness
```

### QA-001 — responsive/RTL/accessibility/visual regression

```text
TASK ID: QA-001
TASK TITLE: Execute complete frontend quality gate

OBJECTIVE:
Independently inspect and validate all completed storefront/admin screens at the required widths and state matrix, then fix only issues inside the assigned QA scope or return precise findings to the owning PR.

ALLOWED FILES / SCOPE:
- QA tests/fixtures/reports
- focused page files when a small validated fix is clearly owned
- design-qa.md and screenshot evidence
- accessibility/browser test config

DO NOT TOUCH:
- domain/API contracts
- provider behavior
- broad visual redesign
- invented references

IMPLEMENTATION REQUIREMENTS:
- Validate 1440, 1280, 1024, 768, 390 and 360 where the selected browser can provide those exact viewports.
- Check RTL, mixed LTR values, no horizontal overflow, keyboard/focus, screen-reader landmarks, reduced motion, touch targets, long Persian strings, large prices and realistic product/order data.
- Check default/loading/empty/error/offline/validation/success/permission/session-expired/stock-conflict/price-change/payment-pending/payment-failed/refund-pending/refund-failed states.
- Compare every new visual screen to the user-supplied reference at the same viewport; do not create comparison source images.
- Record exact limitations when screenshot capture or viewport control is unavailable.

ACCEPTANCE CRITERIA:
- No P0/P1 accessibility, RTL, overflow or broken-route issue remains.
- Each visual PR has evidence or an explicit reference blocker.
- design-qa.md reports observed facts, not unsupported pixel-perfect claims.

BRANCH:
codex/qa-001-responsive-rtl

PR TITLE:
test(QA-001): complete responsive RTL and accessibility QA
```

### REL-001 — release audit

```text
TASK ID: REL-001
TASK TITLE: Run final security, performance and release audit

OBJECTIVE:
Review the integrated branch and all accepted PRs against the completion gate, with independent security, contract, data-integrity, accessibility and performance evidence.

ALLOWED FILES / SCOPE:
- audit report/checklists
- focused tests or narrowly scoped fixes approved by the owner
- dependency/bundle/contract validation configuration
- release documentation

DO NOT TOUCH:
- silently fixing unrelated issues
- provider selection or production credentials
- schema/migration changes without a separate task
- broad refactors

IMPLEMENTATION REQUIREMENTS:
- Inspect actual diff/file ownership, generated artifacts, lockfile changes, runtime wiring and PR scope.
- Verify no secret/raw provider payload/unsafe redirect or unauthorized data exposure.
- Check bundle size, duplicate requests, N+1 queries, cache invalidation, slow/error/offline behavior and database transaction/idempotency paths.
- Run typecheck, lint, tests, build, integration/E2E, Docker/migration checks and record exact result state: PASS, FAIL, PRE-EXISTING FAILURE, NOT RUN or BLOCKED.
- Reject work that is mock-only, unreachable, visually unverified or outside its ownership.

ACCEPTANCE CRITERIA:
- Completion gate has evidence for every applicable item.
- Remaining blockers and user decisions are explicit.
- No task-caused validation failure remains.

BRANCH:
codex/rel-001-release-audit

PR TITLE:
test(REL-001): add final release audit evidence
```

### LAUNCH-001 — staging/controlled launch readiness

```text
TASK ID: LAUNCH-001
TASK TITLE: Prepare staging and controlled launch gate

OBJECTIVE:
Prepare a reversible staging release and verify health, database, queue, storage, payment sandbox, support, SEO and monitoring before any limited public launch.

ALLOWED FILES / SCOPE:
- infra/deploy/**
- staging/launch runbooks
- release checklist and operational dashboards/config
- smoke-test scripts

DO NOT TOUCH:
- production DNS, real payment capture, live customer data or irreversible migration without explicit approval
- product/domain business rules
- frontend redesign

IMPLEMENTATION REQUIREMENTS:
- Resolve launch decisions: brand/domain, final assortment, hosting, payment, SMS, shipping, storage, privacy/terms, support, budget and margin.
- Execute deploy, migration compatibility, seed/fixture-safe smoke, rollback, restore, provider timeout and multiple Iranian-network checks where available.
- Verify health endpoints, home/category/search/product/cart/checkout/auth/order/admin, object storage, worker, database, payment sandbox, monitoring and backup age.
- Define a limited assortment and explicit inventory plan; capture acquisition source, payment success, refund/return and contribution-margin metrics.
- Stop before irreversible production action if authority, credential or decision is missing.

ACCEPTANCE CRITERIA:
- Staging release is reproducible and rollback/restore are executed, not merely documented.
- All critical smoke checks have PASS/BLOCKED evidence.
- Controlled launch recommendation includes risks, owner and rollback trigger.

BRANCH:
codex/launch-001-staging-readiness

PR TITLE:
chore(LAUNCH-001): prepare staging and controlled launch gate
```

## ترتیب merge و روش اجرای تیمی

1. Head/integration owner وضعیت branch و baseline را ثبت می‌کند. هیچ agentی working tree دیگران را reset یا clean نمی‌کند.
2. DB-001، SEC-001 و API-001 را parallel اجرا کن. اول diff و تست هر PR را جدا review کن؛ سپس با توجه به conflict واقعی merge کن.
3. WEB-001 را merge کن و route/page ownership را ثابت کن. بعد از این مرحله، هر page agent باید تا حد ممکن فقط فایل‌های feature خودش را تغییر دهد.
4. AUTH-001 را merge کن و admin protected path را با backend واقعی smoke کن.
5. در wave بعد، admin UI و storefront UI و provider adapterها را parallel اجرا کن. برای PRهای بصری، نبود reference باید blocker واقعی باشد، نه اجازهٔ ساخت صفحهٔ حدسی.
6. SEO-001، OPS-001 و OPS-002 را review و merge کن. هر تغییر package.json، lockfile، global styles، route registry یا migration را با owner مربوطه هماهنگ کن.
7. TEST-001 را با fake adapterها و سپس sandbox providerها اجرا کن. duplicate، timeout، concurrency و rollback را واقعاً اجرا کن.
8. QA-001 باید بعد از merge featureهای UI، ولی قبل از release audit، روی branch یکپارچه اجرا شود. هر finding را به PR owner برگردان یا در همان QA branch فقط fix کوچک و مستند اعمال کن.
9. REL-001 gate نهایی است. تا زمانی که task-caused failure، route unreachable، missing reference، secret، migration gap یا provider decision unresolved وجود دارد، LAUNCH-001 را complete نکن.
10. LAUNCH-001 فقط staging/reversible scope دارد. هر اقدام production، DNS، credential یا data migration نیازمند تأیید صریح و جداگانه است.

## PR checklist مشترک

```markdown
## Objective

## Scope and non-scope

## Files changed

## Contract / migration / security impact

## Visual reference and viewport evidence

<!-- If reference was missing, write BLOCKED BY REFERENCE and do not claim visual completion. -->

## Tests and validation

- [ ] focused tests
- [ ] bun run typecheck
- [ ] bun run lint
- [ ] bun test
- [ ] bun run build
- [ ] Docker/DB/runtime checks when relevant

## Known limitations and blockers

## Rollback / migration notes

## Reviewer notes
```

## Completion gate

کل پروژه فقط زمانی complete اعلام شود که موارد لازم زیر evidence داشته باشند:

- همهٔ مسیرهای موردنظر به implementation واقعی و reachable وصل‌اند؛ mock/static preview جای production path نیست.
- API producer، @nova/api-client consumer، error codes و auth/permission contractها هماهنگ‌اند.
- customer و staff session/cache کاملاً از هم جدا هستند؛ CSRF، role guard، redaction و error boundary بررسی شده‌اند.
- migrationها روی PostgreSQL 16 موردنظر deploy و seed شده‌اند؛ rollback/backup/restore برای محیط release تمرین شده است.
- payment، SMS، shipping و storage provider واقعی یا تصمیم‌گیری‌نشده به‌صورت صادقانه PASS یا BLOCKED ثبت شده‌اند؛ provider unconfigured به‌عنوان success نمایش داده نمی‌شود.
- تمام screenهای لازم stateهای default/loading/empty/error/offline/validation/success/permission و stateهای commerce اختصاصی را دارند.
- desktop/tablet/mobile در viewportهای 1440/1280/1024/768/390/360، RTL و mixed LTR بررسی شده‌اند.
- keyboard، focus، semantics، contrast، reduced motion، touch target و screen-reader behavior بررسی شده‌اند.
- test:integration و test:e2e فقط در صورت وجود harness واقعی PASS اعلام شده‌اند.
- typecheck، lint، test، build و Docker/migration checks نتیجهٔ واقعی و قابل تکرار دارند.
- هر agent یک branch و یک PR داشته، diff آن review شده و PR بدون merge خودسرانه باقی مانده است.
- تمام محدودیت‌ها، تصمیم‌های کاربر، credentialهای مفقود، provider blockerها و تفاوت screenshot evidence با ادعاهای pixel-perfect ثبت شده‌اند.

## Open questions

- شاخهٔ integration نهایی همان master می‌ماند یا قبل از waveهای موازی یک branch جدا برای integration ساخته می‌شود؟
- برای هر صفحهٔ بصری باقی‌مانده، کاربر چه screenshot/reference، viewport و stateهایی را تحویل می‌دهد؟ بدون این ورودی، agent باید بخش visual را متوقف کند و تصویر نسازد.
- providerهای payment، SMS/notification، shipping، object storage، hosting/backup/monitoring و سیاست نهایی shipping/returns کدام‌اند؟
