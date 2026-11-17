# Deployment guide

## Requirements

- Node.js 22 LTS or later
- MySQL 8.4 on the company server
- A reverse proxy with HTTPS (IIS, nginx or Caddy) in front of the Next.js server

## 1. Database

```sql
CREATE DATABASE `10xmom` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER '10xmom'@'localhost' IDENTIFIED BY 'a-long-random-password';
GRANT ALL PRIVILEGES ON `10xmom`.* TO '10xmom'@'localhost';
```

For `prisma migrate dev` in development, Prisma also needs a shadow database, so give the dev user
`CREATE, DROP` on `*.*`, or set `shadowDatabaseUrl`. Production uses `migrate deploy`, which needs no shadow database.

## 2. Backend

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm ci
npx prisma migrate dev --name init   # first time in development (creates prisma/migrations)
# production: npx prisma migrate deploy
npm run seed                 # price list, sample Moms, first admin account
npm run build
npm start                    # http://127.0.0.1:4000/api/v1
```

After the first seed, remove `ADMIN_PASSWORD` from `.env` and change the password in Admin → Settings.

Production `.env` extras: `NODE_ENV=production`, `COOKIE_SECURE=1`, `TRUST_PROXY=1` (behind the proxy).

## 3. Frontend

```bash
cd frontend
cp .env.example .env.local  # API_URL=http://127.0.0.1:4000, NEXT_PUBLIC_SITE_URL=https://your-domain
npm ci
npm run build
npm start                    # http://127.0.0.1:3000
```

Point the reverse proxy at port 3000 only. Port 4000 (API) and 3306 (MySQL) should not be reachable from outside.

## 4. Keep it running

Run both apps as services, for example with PM2 (`pm2 start npm --name 10xmom-api -- start` in `backend/`
and `pm2 start npm --name 10xmom-web -- start` in `frontend/`), or as Windows services via NSSM.

## 5. Backup and recovery

- Nightly logical backup:
  `mysqldump --single-transaction --routines --triggers -u 10xmom -p 10xmom | gzip > 10xmom-$(date +%F).sql.gz`
- Keep 14 daily and 8 weekly copies, with at least one copy off the server (cloud storage or another machine).
- Turn on binary logs (`log_bin`) for point-in-time recovery between nightly dumps.
- Restore: `gunzip < file.sql.gz | mysql -u 10xmom -p 10xmom`. Test a restore into a scratch database once a month.

## 6. Updating

```bash
git pull
cd backend && npm ci && npx prisma migrate deploy && npm run build && pm2 restart 10xmom-api
cd ../frontend && npm ci && npm run build && pm2 restart 10xmom-web
```
