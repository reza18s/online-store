# Storefront page contexts

These files cover the distinct page screens routed by `apps/web`. Several URL patterns use the same screen, so they share one context file.

| Screen | URL patterns | Context |
|---|---|---|
| Home | `/`, `/search` | [home-discovery.md](home-discovery.md) |
| Category discovery | `/category/:audience` | [category-discovery.md](category-discovery.md) |
| Product listing | `/products`, `/products/:mode`, `/products/:audience` | [listing-discovery.md](listing-discovery.md) |
| Product detail | `/product/:slug` | [product-discovery.md](product-discovery.md) |
| Authentication | `/auth`, `/auth/request`, `/auth/verify` | [auth.md](auth.md) |
| Cart | `/cart`, `/cart/empty`, `/cart/conflict` | [cart.md](cart.md) |
| Preview states | `/checkout/payment-pending`, `/checkout/payment-failed`, `/state/offline`, `/state/error`, `/state/maintenance` | [preview-state.md](preview-state.md) |
| Payment recovery | `/checkout/payment-recovery` | [checkout-payment-recovery.md](checkout-payment-recovery.md) |
| Checkout confirmation | `/checkout/confirmation` | [checkout-confirmation.md](checkout-confirmation.md) |
| Local payment | `/checkout/local-payment` | [local-payment.md](local-payment.md) |
| Checkout | `/checkout/:step` | [checkout.md](checkout.md) |
| Account | `/account`, `/account/:section` | [account.md](account.md) |
| Address book | `/account/addresses`, `/account/addresses/create`, `/account/addresses/edit`, `/account/addresses/edit/:id` | [address-book.md](address-book.md) |
| Order detail | `/order/:orderNumber` | [order.md](order.md) |
| Returns | `/return`, `/return/request`, `/return/status` | [return.md](return.md) |
| Editorial and content | `/campaign`, `/guide`, `/article`, `/lookbook`, `/about`, `/trust`, `/size-guide`, `/shipping-policy`, `/returns-policy`, `/care-guide`, `/faq`, `/contact`, `/privacy`, `/terms`, `/support`, `/content/:slug` | [public-content.md](public-content.md) |
| Not found | Any unmatched storefront route | [not-found.md](not-found.md) |

Each context contains its page component and the custom JSX components found by `scripts/script.ts`. Shared app chrome, stylesheets, assets, and non-visual hooks are outside these per-screen extracts.
