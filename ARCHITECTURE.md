# Veld ECOM — Architecture

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router, React 19) |
| Language | TypeScript 5 |
| Database | PostgreSQL 16 via Drizzle ORM + postgres.js |
| Auth | next-auth v5 beta (Credentials provider, JWT sessions) |
| Validation | Zod v4 |
| Styling | CSS custom properties (design tokens) + Tailwind v4 |
| Passwords | bcryptjs |

## Multi-tenant model

Each merchant is a **tenant**. A tenant owns:
- `store_settings` — branding, contact, VAT config
- `products`, `variants`, `categories`
- `customers`, `addresses`
- `orders`, `order_lines`, `payments`
- `promo_codes`, `promo_uses`

**Tenant isolation** is enforced at the application layer via `withTenant()` — every DB
transaction sets `app.current_tenant_id` which can be used by PostgreSQL RLS policies.
Add RLS policies to your schema migration for production hardening.

## Tenant resolution

```
Subdomain:   shop.ecom.co.za  →  slug = "shop"
Dev header:  x-tenant-slug    →  slug from header
Dev env:     DEV_TENANT_SLUG  →  slug from env var
Query param: ?tenant=slug     →  slug from URL
```

The middleware resolves the slug and injects it as `x-tenant-slug` for server components.
Server components call `getTenantSlug()` or `requireTenantSlug()` from `src/lib/tenant.ts`.

Admin routes resolve tenantId from the JWT session (`session.user.tenantId`).

## Storefront routing

```
/[store]/                  →  Storefront homepage (hero, categories, featured)
/[store]/products          →  Product catalogue (sidebar filters, grid)
/[store]/products/[slug]   →  Product detail page (PDP)
/[store]/cart              →  Cart (localStorage, client component)
/[store]/checkout          →  Checkout form → POST /api/checkout
/[store]/order-confirmed   →  Order confirmation
```

## Admin routing

```
/admin                     →  Dashboard (stats, recent orders)
/admin/orders              →  Orders list
/admin/products            →  Products list + search
/admin/products/new        →  New product form
/admin/products/[id]       →  Edit product form
/admin/customers           →  Customers list
/admin/categories          →  Categories
/admin/promos              →  Promo codes
/admin/settings/store      →  Store settings (name, contact, VAT)
/admin/settings/theme      →  Theme customisation (roadmap)
```

## South African specifics

- **Currency**: ZAR throughout, formatted as `R 1 234.56`
- **VAT**: 15% inclusive pricing. `calcVat()` in `src/lib/money.ts` extracts the VAT
  component from an inclusive price.
- **Provinces**: All 9 SA provinces in dropdowns
- **POPIA compliance**: `marketingConsent` column on customers, consent notice on checkout

## Payment integrations roadmap

| Provider | Status | Notes |
|---|---|---|
| PayFast | Planned | SA-native, supports card/EFT/SnapScan/Ozow |
| Yoco | Planned | Popular SA card gateway, good developer experience |
| Peach Payments | Planned | Enterprise-grade, multi-currency |
| EFT | Live (manual) | Order placed, customer pays manually |

## Shipping integrations roadmap

| Provider | Status | Notes |
|---|---|---|
| Bob Go | Planned | Multi-carrier SA aggregator |
| Pargo | Planned | Click-and-collect network |
| Aramex SA | Planned | Courier |
| The Courier Guy | Planned | Budget courier |

## Database

Port **5433** (avoids conflict with sibling POS project on 5432).

```
docker compose up -d
cp .env.example .env
# Edit DATABASE_URL in .env
npm run db:push
npm run db:seed
```
