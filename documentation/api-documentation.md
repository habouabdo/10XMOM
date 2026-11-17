# API (v1)

Base URL: `/api/v1`. Interactive Swagger docs: `http://127.0.0.1:4000/api/docs`. They are on in development,
and in production only if `SWAGGER=1`.

Errors always look like `{ "statusCode": 400, "error": "Human-readable message" }`.

## Public

| Method | Path | Body / query | Notes |
|---|---|---|---|
| GET | `/config` | | Areas, slots, WhatsApp number, exchange rate, fees, gift card presets |
| GET | `/catalog` | | Active price list grouped by category → subcategory |
| POST | `/quotes` | `{ items: [{ id, qty }], serviceLevel?: 'STANDARD'\|'EXPRESS', firstOrder?: boolean }` | Returns the estimate breakdown in LBP and USD |
| GET | `/moms?area=` | | Active Moms covering an area |
| GET | `/availability?area=&date=YYYY-MM-DD&momId=any\|id` | | Each slot with `available` |
| POST | `/orders` | `{ name, phone, area, address, addressNotes?, notes?, items, serviceLevel?, momId?, pickupDate, pickupSlot, giftCardCode? }` | 10/hour per IP. Returns `{ code, momName, pickupDate, pickupSlot, quote }` |
| GET | `/track?code=&phone=` | | 40 per 10 min per IP |
| POST | `/gift-cards` | `{ amountUsd, buyerName, buyerPhone, recipientName, recipientPhone?, message? }` | 10/hour. Creates a card awaiting payment, returns `{ code, amountUsd }` |
| GET | `/gift-cards/check?code=` | | Balance of an active card. 20 per 10 min |
| POST | `/applications` | `{ name, phone, area, experience?, hasCar? }` | 5/hour |
| GET | `/health` | | Database check |

Phone numbers accept any Lebanese format (`03 123 456`, `+961 3 123456`, `71123456`) and are stored as `961XXXXXXXX`.

## Auth

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | `{ email, password }`. Sets the httpOnly `admin_session` cookie (12h). 10 per 15 min |
| POST | `/auth/logout` | Clears the cookie |
| GET | `/auth/me` | Current admin |
| POST | `/auth/password` | `{ current, next }` (next ≥ 12 chars) |

## Admin (cookie required)

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/admin/orders?status=active\|all\|booked…&q=` | ADMIN, STAFF | Up to 500, with counts per status |
| PATCH | `/admin/orders/:id` | ADMIN, STAFF | `{ status?, momId?, priceUsd?, paymentLink?, note? }`. See the lifecycle in architecture.md |
| GET | `/admin/gift-cards` | ADMIN, STAFF | |
| PATCH | `/admin/gift-cards/:id` | ADMIN, STAFF | `{ status?: 'ACTIVE'\|'CANCELLED', paymentLink? }`. Activating sets the expiry date |
| GET | `/admin/moms` | ADMIN, STAFF | With open order counts |
| POST / PATCH | `/admin/moms`, `/admin/moms/:id` | ADMIN | `{ name, phone?, areas, bio?, active? }` |
| GET / PATCH | `/admin/applications`, `/admin/applications/:id` | ADMIN, STAFF | `{ status }` |
| GET | `/admin/prices` | ADMIN, STAFF | All items including hidden ones |
| POST / PUT | `/admin/prices`, `/admin/prices/:id` | ADMIN | `{ category, subcategory?, name, description?, priceLbp, unit, active? }` |
| GET / PUT | `/admin/settings` | GET: both, PUT: ADMIN | Partial updates allowed |
