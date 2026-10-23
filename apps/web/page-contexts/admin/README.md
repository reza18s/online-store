# Admin page contexts

These contexts cover the distinct screens and routed view families in `apps/admin`. Source paths inside these extracts are relative to the Admin app root. The route dispatcher is `src/app/routes/AdminRouter.tsx`.

| Screen or view family | URL patterns / condition | Context |
|---|---|---|
| Sign in | `/admin/login`; also shown when no staff session exists | [admin-login.md](admin-login.md) |
| Dashboard | `/admin` (when the staff role can access it) | [admin-dashboard.md](admin-dashboard.md) |
| Orders list | `/admin/orders` | [admin-orders.md](admin-orders.md) |
| Order detail | `/admin/orders/:orderNumber` | [admin-order-detail.md](admin-order-detail.md) |
| Support and finance | `/admin/payments`, `/admin/customers`, `/admin/notifications`, `/admin/audit` | [admin-support-finance.md](admin-support-finance.md) |
| Catalog | `/admin/catalog`, `/admin/catalog/products`, `/admin/catalog/categories`, `/admin/catalog/products/new`, `/admin/catalog/products/:productId` | [admin-catalog-inventory.md](admin-catalog-inventory.md) |
| Inventory | `/admin/inventory`, `/admin/inventory/:variantId` | [admin-catalog-inventory.md](admin-catalog-inventory.md) |
| Content and SEO | `/admin/content`, `/admin/content/pages`, `/admin/content/pages/:pageId`, `/admin/content/seo`, `/admin/content/redirects` | [admin-content-seo.md](admin-content-seo.md) |
| Unknown Admin route | Any other `/admin/...` path | [admin-route-unavailable.md](admin-route-unavailable.md) |

## Shared states and shell

- Staff sign-in form: [admin-login.md](admin-login.md)
- Permission denied: [admin-permission-denied.md](admin-permission-denied.md)
- Staff session loading: [admin-session-loading.md](admin-session-loading.md)
- Shared authenticated navigation and workspace layout: [admin-workspace-shell.md](admin-workspace-shell.md)

Each context includes the page component and custom JSX components discovered by `scripts/script.ts`. CSS, assets, and non-visual hooks are not included in these extracts. The route dispatcher controls authentication, permissions, and view selection.
