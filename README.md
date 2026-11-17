# 10x M♥M

Laundry pickup and delivery booking site for Lebanon.

```
10xmom/
├── frontend/        Next.js 15 + React 19 + TypeScript + Tailwind 4, PWA
├── backend/         NestJS 11 + Prisma + MySQL 8.4, REST API at /api/v1, Swagger at /api/docs
├── documentation/   architecture.md · api-documentation.md · deployment-guide.md
├── docs/            Source material (full-stack spec, Global Laundry price list)
└── legacy/          Previous plain-Node + SQLite version, kept as reference until the new stack is live
```

## What customers can do

- **Book** (`/book`): area and address, a Mom (or "any available"), a pickup slot, items from the price
  list with standard or next-day express, an optional gift card code, then name and WhatsApp. Nothing is
  paid at booking. They get a code like `10X-7KQ2PM`.
- **Price calculator** (`/pricing`): every price-list item, search, live LBP/USD estimate. "Book with these
  items" carries the basket into the booking form.
- **Gift cards** (`/gift-cards`): choose an amount, add a message, and see a live preview of the card.
  Paid through a Whish link on WhatsApp.
- **Track** (`/track`) every step with the code and WhatsApp number, and pay through the Whish link once the order is priced.
- Services, About us, How it works, FAQ, Contact, and Become a Mom (applications).

## How an order works (admin at `/admin`)

1. The order arrives as *Booked*, with the items and an estimate.
2. The Mom picks it up. Set *Picked up*.
3. Enter the final price (USD, or click "Use estimate") and the Whish link, then save. The order becomes
   *Priced* and any gift card is deducted. Click the WhatsApp button to send the price and link.
4. The customer pays. Then mark *Paid*, *Out for delivery* and *Delivered*, each with a ready-made WhatsApp message.

Gift cards: a new card is *Awaiting payment*. Paste a Whish link, send it, and click **Mark paid · activate**.

## Run it locally

You need Node.js 22+ and MySQL 8.4.

```bash
# 1. API
cd backend
cp .env.example .env              # set DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npx prisma migrate dev --name init
npm run seed
npm run start:dev                 # http://127.0.0.1:4000/api/v1  ·  docs: /api/docs

# 2. Website (second terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                       # http://localhost:3000
```

Tests: `cd backend && npm test` (price engine, phone parsing, slot rules).

See [documentation/deployment-guide.md](documentation/deployment-guide.md) for production, backups and updates.
