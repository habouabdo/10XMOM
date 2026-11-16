# 10x M♥M

Laundry pickup and delivery booking site for Lebanon.

## How an order works

1. **The customer books** at `/book`: area and address, then a Mom (or "Any available Mom"), a pickup day and time, what they're sending, and their name and WhatsApp number. Nothing is paid at this step. They get an order code like `10X-7KQ2PM`.
2. **The Mom picks up the clothes.** In `/admin`, set the status to *Picked up*.
3. **Price it.** Enter the price (USD) and paste the **Whish payment link**, then save. The order moves to *Priced – awaiting payment*. Click **Send price + Whish link** to open WhatsApp with the message already written.
4. **The customer pays** through Whish. Mark the order *Paid*, then *Out for delivery*, then *Delivered*. Each step has a ready-made WhatsApp message.

Customers can follow every step at `/track` using their code and WhatsApp number.

## Run it

Requires Node.js 22.13 or later (this server has Node 24). There are no npm packages to install.

```bash
cd 10xmom
node server.js          # http://127.0.0.1:3410
```

On first start the server creates `data/10xmom.sqlite` and a random admin password in `data/admin-password.txt`. Log in at `/admin`, change the password under **Settings**, then delete that file.

Environment variables (all optional):

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3410` | Port to listen on |
| `HOST` | `127.0.0.1` | Address to bind (keep it local behind IIS) |
| `NODE_ENV` | | Set to `production` to cache page templates |
| `DATA_DIR` | `./data` | Where the database lives. **Back this folder up.** |
| `ADMIN_PASSWORD` | | Resets the admin password at startup |
| `TRUST_PROXY` | | `1` when behind IIS/Cloudflare, so rate limits see the real visitor IP |
| `COOKIE_SECURE` | | `1` when the site is served over HTTPS |

## First-time setup in /admin

- **Settings:** your business WhatsApp number (this turns on the WhatsApp buttons across the site), your website address, service areas, pickup time slots, clothes types, and how many pickups one Mom can take per time slot.
- **Moms:** four sample Moms are created so booking works out of the box. Edit them or set them inactive, and add your real Moms with the areas they cover.
- **Prices:** customers aren't shown prices. You price each order after pickup.

## Going live on this IIS server

Node runs the site, and IIS forwards your domain to it:

1. Install **Application Request Routing (ARR)** for IIS and enable its proxy. URL Rewrite is already installed.
2. Create an IIS site for your domain and add a reverse-proxy rule to `http://127.0.0.1:3410`.
3. Keep Node running as a Windows service (for example with NSSM or `pm2`), with `NODE_ENV=production`, `TRUST_PROXY=1` and `COOKIE_SECURE=1`.
4. Add HTTPS (win-acme / Let's Encrypt, or Cloudflare).

## Project layout

```
server.js            HTTP server, API, validation, admin auth
db.js                SQLite schema (node:sqlite) + settings helpers
public/              pages (shared header/footer in public/partials)
public/assets/       styles.css, site.js (shared), book.js, track.js, join.js, admin.js
data/                database + generated admin password (not in git)
```
