# Architecture

```
Browser / installed PWA
        │  HTTPS
        ▼
frontend/  Next.js 15 (App Router, React 19, TypeScript, Tailwind 4)   :3000
        │  /api/v1/* is proxied server-side (next.config.ts rewrites)
        ▼
backend/   NestJS 11 (TypeScript, REST, Swagger)                        :4000 (localhost only)
        │  Prisma ORM
        ▼
MySQL 8.4 on the company server
```

- The browser only talks to the Next.js server. `/api/v1/*` requests are forwarded to NestJS, so the admin
  session cookie is same-origin and the API and database never need a public port.
- Only `backend/` has database credentials (`DATABASE_URL` in `backend/.env`). The frontend has no database
  access at all.
- Server components (home, services, pricing, about) fetch the catalog and config from the API with a
  5-minute cache (ISR). If the API is down they still render, with empty data.

## Frontend (`frontend/src`)

| Folder | Contents |
|---|---|
| `app/` | Routes: `/`, `/services`, `/pricing`, `/book`, `/track`, `/gift-cards`, `/about`, `/how-it-works`, `/faq`, `/contact`, `/join`, `/admin`, plus `manifest.ts`, `robots.ts`, `sitemap.ts`, error/loading/404 |
| `components/` | Header, Footer, Logo, Icons, ServiceGrid, `pricing/` (ItemPicker, QuoteSummary, PriceCalculator), `admin/` (one component per admin tab) |
| `hooks/` | `useConfig` (public settings, fetched once), `useQuote` (live price estimate + basket hand-off to booking) |
| `services/` | `api.ts` is the single browser API client; `server-api.ts` handles server-side fetches |
| `types/` | Shared TypeScript types for API responses |
| `lib/` | Formatting helpers, service category metadata |

Forms validate on the client with zod and again on the server with class-validator. The server is always
the authority.

PWA: `app/manifest.ts`, `public/sw.js` (network-first pages, cache-first static assets, never caches
`/api` or `/admin`), `public/offline.html`, and icons in `public/icons/`.

### Brand palette

Defined once as Tailwind theme tokens in `app/globals.css`:

| Token | Hex | Use |
|---|---|---|
| `clay-600` | `#C4532D` | Primary buttons and calls to action (white text passes WCAG AA) |
| `clay-500` | `#D9663F` | Brand terracotta: logo heart, accents |
| `sea-600` / `sea-700` | `#0F5C63` / `#0C4A50` | Headings, dark sections, secondary buttons |
| `saffron-400` | `#F2B544` | Highlights, step numbers, badges |
| `linen` / `sand` | `#FBF5EC` / `#F3E9DA` | Page and section backgrounds |
| `ink` / `muted` | `#1F2A2C` / `#5B6668` | Body text |

## Backend (`backend/src`)

One module per business area. Each has a controller (HTTP + Swagger), a service (business logic + Prisma),
and DTOs (class-validator).

| Module | Responsibility |
|---|---|
| `prisma` | `PrismaService`, the only place that opens a database connection |
| `settings` | Key/value settings (areas, slots, exchange rate, fees, gift card rules), `GET /config` |
| `auth` | Admin login (JWT in an httpOnly `admin_session` cookie, 12h), logout, me, change password |
| `catalog` | Price list (seeded from `docs/Global_Laundry_Price_List.xlsx`), `POST /quotes` price engine (`quote.ts`) |
| `moms` | Moms and the areas they cover |
| `orders` | Availability, booking, tracking, admin status workflow, gift card deduction |
| `gift-cards` | Purchase, balance check, admin activation/cancellation |
| `applications` | "Become a Mom" applications |
| `health` | `GET /health` (checks the database) |

Cross-cutting pieces live in `common/`:

- `JwtAuthGuard` and `RolesGuard` with `@Roles(ADMIN, STAFF)`. STAFF can run orders, gift cards and
  applications; only ADMIN can change prices, Moms and settings.
- `AllExceptionsFilter` returns one error shape for the whole API: `{ statusCode, error }`.
- `LoggingInterceptor` logs method, path, status and duration. `RequestIdMiddleware` tags each request.
- The global `ValidationPipe` uses `whitelist` and `forbidNonWhitelisted`. Rate limits come from
  `@nestjs/throttler`, set globally and per route.
- Helmet sets security headers.

## Pricing rules (`backend/src/catalog/quote.ts`)

- Item prices are in LBP (price list). Totals are shown in LBP and in USD at the admin-set rate (`usd_lbp_rate`).
- Express (next day) = item prices × `express_multiplier` (default 2). Pickup & delivery is not multiplied.
- Pickup & delivery: flat `pickup_delivery_fee_usd` (default $5) per order.
- First-order discount: `first_order_discount_percent` (default 15%) of items, applied automatically when the
  WhatsApp number has no earlier non-cancelled order.
- The booking stores an **estimate**. The admin enters the **final price** in USD after pickup.

## Order lifecycle

`BOOKED → PICKED_UP → PRICED → PAID → OUT_FOR_DELIVERY → DELIVERED` (or `CANCELLED`)

- Saving a price plus a Whish link on a booked or picked-up order moves it to `PRICED`.
- If the order carries a gift card, the card balance is deducted when the order is priced, inside one
  transaction that also writes a `GiftCardRedemption` row. If the card covers the whole price, the order
  goes straight to `PAID`. Cancelling restores the balance.
- Booking runs in a SERIALIZABLE transaction so two customers cannot overbook a Mom's slot.

## Database

See `backend/prisma/schema.prisma`. Tables: `AdminUser`, `Setting`, `Mom`, `Order`, `OrderEvent`,
`Application`, `PriceItem`, `GiftCard`, `GiftCardRedemption`. Foreign keys are explicit. Indexes cover the
slot-capacity lookup, status filters and phone lookups. Money is stored as `DECIMAL(10,2)` USD; price-list
items are integer LBP.
