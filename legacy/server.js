import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, DATA_DIR, getSetting, setSetting } from './db.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT) || 3410;
const HOST = process.env.HOST || '127.0.0.1';
const PRODUCTION = process.env.NODE_ENV === 'production';
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const TIMEZONE = 'Asia/Beirut';
const BOOKING_DAYS = 14;
const SESSION_DAYS = 7;

const STATUSES = {
  booked: 'Booked',
  picked_up: 'Picked up',
  priced: 'Priced – awaiting payment',
  paid: 'Paid',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
const APPLICATION_STATUSES = ['new', 'contacted', 'hired', 'rejected'];

const DEFAULT_SETTINGS = {
  areas: [
    'Achrafieh', 'Badaro', 'Hamra', 'Ras Beirut', 'Verdun', 'Mar Mikhael', 'Sin El Fil', 'Dekwaneh',
    'Jdeideh', 'Antelias', 'Dbayeh', 'Jal El Dib', 'Zalka', 'Baabda', 'Hazmieh', 'Hadath',
    'Jounieh', 'Kaslik', 'Zouk', 'Jbeil', 'Broummana', 'Beit Mery', 'Aley', 'Saida', 'Tripoli', 'Zahle',
  ],
  slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00'],
  item_types: [
    'Everyday clothes (bag)', 'Shirts & blouses', 'Dresses', 'Abayas & delicates', 'Suits & jackets',
    'Bed sheets & duvets', 'Curtains', 'Kids clothes', 'Ironing only (pieces)',
  ],
  slot_capacity: 3,
  business_whatsapp: '',
  business_email: '',
  site_url: '',
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ---------- time (all booking times are Beirut time) ----------

function beirutNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((p) => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

function addDays(date, days) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function slotStartMinutes(slot) {
  const [h, m] = slot.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

// A slot can be booked up to an hour before it starts, and at most BOOKING_DAYS ahead.
function isSlotOpen(date, slot) {
  const now = beirutNow();
  if (date < now.date || date > addDays(now.date, BOOKING_DAYS)) return false;
  return date !== now.date || slotStartMinutes(slot) >= now.minutes + 60;
}

// ---------- validation ----------

function text(value, field, { max = 200, required = false } = {}) {
  const v = value == null ? '' : String(value).trim();
  if (required && !v) throw new HttpError(400, `${field} is required.`);
  if (v.length > max) throw new HttpError(400, `${field} is too long (max ${max} characters).`);
  return v;
}

// Stores Lebanese numbers as 961XXXXXXXX so they work directly in wa.me links.
function normalizePhone(value, field = 'Phone number') {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('961')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!/^\d{7,8}$/.test(digits)) {
    throw new HttpError(400, `${field} must be a valid Lebanese number, e.g. 03 123 456 or 71 123 456.`);
  }
  return `961${digits}`;
}

function httpsUrl(value, field) {
  const v = text(value, field, { max: 500 });
  if (!v) return '';
  let url;
  try {
    url = new URL(v);
  } catch {
    throw new HttpError(400, `${field} must be a full link starting with https://`);
  }
  if (url.protocol !== 'https:') throw new HttpError(400, `${field} must start with https://`);
  return url.toString();
}

function stringList(value, field, { pattern, max = 100 } = {}) {
  if (!Array.isArray(value)) throw new HttpError(400, `${field} must be a list.`);
  const list = [...new Set(value.map((v) => String(v).trim()).filter(Boolean))];
  if (!list.length) throw new HttpError(400, `${field} cannot be empty.`);
  if (list.length > max) throw new HttpError(400, `${field} has too many entries.`);
  for (const item of list) {
    if (item.length > 80) throw new HttpError(400, `"${item.slice(0, 20)}…" in ${field} is too long.`);
    if (pattern && !pattern.test(item)) throw new HttpError(400, `"${item}" in ${field} has the wrong format.`);
  }
  return list;
}

function positiveId(value, field) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, `${field} is invalid.`);
  return id;
}

// ---------- settings & admin auth ----------

function settings() {
  const s = {};
  for (const [key, fallback] of Object.entries(DEFAULT_SETTINGS)) s[key] = getSetting(key, fallback);
  return s;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  return `${salt.toString('hex')}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const actual = crypto.scryptSync(String(password), Buffer.from(salt, 'hex'), 64);
  return crypto.timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}

function initAdminPassword() {
  if (process.env.ADMIN_PASSWORD) {
    setSetting('admin_password_hash', hashPassword(process.env.ADMIN_PASSWORD));
    return;
  }
  if (getSetting('admin_password_hash', null)) return;
  const password = crypto.randomBytes(9).toString('base64url');
  setSetting('admin_password_hash', hashPassword(password));
  const file = path.join(DATA_DIR, 'admin-password.txt');
  writeFileSync(file, `Admin password for /admin: ${password}\nChange it in Admin → Settings, then delete this file.\n`);
  console.log(`Generated an admin password and saved it to ${file}`);
}

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

function parseCookies(req) {
  const cookies = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i <= 0) continue;
    try {
      cookies[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      // ignore malformed cookie values
    }
  }
  return cookies;
}

function sessionCookie(req, token, maxAgeSeconds) {
  const secure = req.headers['x-forwarded-proto'] === 'https' || process.env.COOKIE_SECURE === '1';
  return `admin_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}${secure ? '; Secure' : ''}`;
}

function requireAdmin(req) {
  const token = parseCookies(req).admin_session;
  const row = token && db.prepare('SELECT expires_at FROM sessions WHERE token_hash = ?').get(sha256(token));
  if (!row || row.expires_at < Date.now()) throw new HttpError(401, 'Please log in.');
}

// ---------- rate limiting (in memory, per IP) ----------

const buckets = new Map();

function rateLimit(key, max, windowMs) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    bucket = { count: 0, reset: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > max) throw new HttpError(429, 'Too many requests. Please try again a little later.');
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.reset < now) buckets.delete(key);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
}, 10 * 60 * 1000).unref();

function clientIp(req) {
  if (TRUST_PROXY && req.headers['x-forwarded-for']) return req.headers['x-forwarded-for'].split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

// ---------- moms, availability & orders ----------

const parseMom = (row) => ({ ...row, areas: JSON.parse(row.areas), active: Boolean(row.active) });

function activeMomsInArea(area) {
  return db.prepare('SELECT * FROM moms WHERE active = 1 ORDER BY name').all().map(parseMom)
    .filter((mom) => mom.areas.includes(area));
}

const slotLoadQuery = db.prepare(
  "SELECT COUNT(*) AS n FROM orders WHERE mom_id = ? AND pickup_date = ? AND pickup_slot = ? AND status != 'cancelled'"
);
const slotLoad = (momId, date, slot) => slotLoadQuery.get(momId, date, slot).n;

function parseArea(value, s) {
  const area = text(value, 'Area', { required: true });
  if (!s.areas.includes(area)) throw new HttpError(400, 'Please choose an area from the list.');
  return area;
}

function parsePickup(body, s) {
  const pickup_date = text(body.pickup_date, 'Pickup date', { required: true });
  const pickup_slot = text(body.pickup_slot, 'Pickup time', { required: true });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pickup_date) || !s.slots.includes(pickup_slot)) {
    throw new HttpError(400, 'Please choose a pickup day and time.');
  }
  if (!isSlotOpen(pickup_date, pickup_slot)) throw new HttpError(409, 'That pickup time is no longer available. Please pick another.');
  return { pickup_date, pickup_slot };
}

function parseItems(value, types) {
  if (!Array.isArray(value)) return [];
  const items = new Map();
  for (const item of value.slice(0, 30)) {
    const qty = Number(item?.qty);
    if (!types.includes(item?.type) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw new HttpError(400, 'One of the clothes items is invalid.');
    }
    items.set(item.type, qty);
  }
  return [...items].map(([type, qty]) => ({ type, qty }));
}

function availability(query) {
  const s = settings();
  const area = parseArea(query.get('area'), s);
  const date = text(query.get('date'), 'Date', { required: true });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, 'Date is invalid.');
  const momParam = query.get('mom_id');
  const momId = momParam && momParam !== 'any' ? positiveId(momParam, 'Mom') : null;
  const moms = activeMomsInArea(area).filter((mom) => !momId || mom.id === momId);
  return {
    date,
    slots: s.slots.map((slot) => ({
      slot,
      available: isSlotOpen(date, slot) && moms.some((mom) => slotLoad(mom.id, date, slot) < s.slot_capacity),
    })),
  };
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function newOrderCode() {
  for (;;) {
    let code = '10X-';
    for (let i = 0; i < 6; i++) code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    if (!db.prepare('SELECT 1 FROM orders WHERE code = ?').get(code)) return code;
  }
}

function addEvent(orderId, status, note = '') {
  db.prepare('INSERT INTO order_events (order_id, status, note) VALUES (?, ?, ?)').run(orderId, status, note);
}

function createOrder(body) {
  const s = settings();
  const customer_name = text(body.name, 'Name', { max: 80, required: true });
  const phone = normalizePhone(body.phone, 'WhatsApp number');
  const area = parseArea(body.area, s);
  const address = text(body.address, 'Address', { max: 300, required: true });
  const address_notes = text(body.address_notes, 'Building / floor notes', { max: 200 });
  const notes = text(body.notes, 'Notes', { max: 500 });
  const items = parseItems(body.items, s.item_types);
  if (!items.length && !notes) throw new HttpError(400, 'Tell us what we are picking up: add at least one item or a note.');
  const { pickup_date, pickup_slot } = parsePickup(body, s);

  const free = activeMomsInArea(area)
    .map((mom) => ({ mom, load: slotLoad(mom.id, pickup_date, pickup_slot) }))
    .filter(({ load }) => load < s.slot_capacity);

  let mom;
  if (body.mom_id == null || body.mom_id === '' || body.mom_id === 'any') {
    mom = free.sort((a, b) => a.load - b.load)[0]?.mom;
    if (!mom) throw new HttpError(409, 'Sorry, no Mom is free at that time. Please pick another time.');
  } else {
    const momId = positiveId(body.mom_id, 'Mom');
    mom = free.find((entry) => entry.mom.id === momId)?.mom;
    if (!mom) throw new HttpError(409, 'That Mom is not free at that time. Please pick another time or another Mom.');
  }

  const code = newOrderCode();
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO orders (code, customer_name, phone, area, address, address_notes, items, notes, mom_id, pickup_date, pickup_slot)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(code, customer_name, phone, area, address, address_notes, JSON.stringify(items), notes, mom.id, pickup_date, pickup_slot);
  addEvent(Number(lastInsertRowid), 'booked', 'Order placed online');
  return { code, mom_name: mom.name, pickup_date, pickup_slot };
}

const ORDER_SELECT = 'SELECT o.*, m.name AS mom_name FROM orders o LEFT JOIN moms m ON m.id = o.mom_id';

function trackOrder(query) {
  const code = text(query.get('code'), 'Order code', { max: 20, required: true }).toUpperCase();
  const phone = normalizePhone(query.get('phone'), 'WhatsApp number');
  const order = db.prepare(`${ORDER_SELECT} WHERE o.code = ?`).get(code);
  if (!order || order.phone !== phone) throw new HttpError(404, "We couldn't find an order with that code and number.");
  const events = db.prepare('SELECT status, created_at FROM order_events WHERE order_id = ? ORDER BY id').all(order.id);
  return {
    code: order.code,
    status: order.status,
    status_label: STATUSES[order.status],
    first_name: order.customer_name.split(/\s+/)[0],
    area: order.area,
    pickup_date: order.pickup_date,
    pickup_slot: order.pickup_slot,
    mom_name: order.mom_name,
    items: JSON.parse(order.items),
    price_usd: order.price_usd,
    payment_link: order.status === 'priced' ? order.payment_link : '',
    events,
  };
}

function serializeOrders(rows) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const events = db.prepare(
    `SELECT order_id, status, note, created_at FROM order_events WHERE order_id IN (${ids.map(() => '?').join(',')}) ORDER BY id`
  ).all(...ids);
  return rows.map((row) => ({
    ...row,
    items: JSON.parse(row.items),
    events: events.filter((e) => e.order_id === row.id),
  }));
}

function listOrders(query) {
  const status = query.get('status') || 'active';
  const search = (query.get('q') || '').trim();
  const where = [];
  const params = [];
  if (status === 'active') where.push("o.status NOT IN ('delivered', 'cancelled')");
  else if (status !== 'all') {
    if (!(status in STATUSES)) throw new HttpError(400, 'Unknown status filter.');
    where.push('o.status = ?');
    params.push(status);
  }
  if (search) {
    const digits = search.replace(/\D/g, '');
    where.push('(o.code LIKE ? OR o.customer_name LIKE ? OR o.phone LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${digits || search}%`);
  }
  const rows = db.prepare(`
    ${ORDER_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY o.pickup_date, o.pickup_slot, o.id LIMIT 500
  `).all(...params);
  const counts = Object.fromEntries(
    db.prepare('SELECT status, COUNT(*) AS n FROM orders GROUP BY status').all().map((r) => [r.status, r.n])
  );
  return { orders: serializeOrders(rows), counts, statuses: STATUSES };
}

function updateOrder(id, body) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) throw new HttpError(404, 'Order not found.');
  const changes = {};

  if ('mom_id' in body) {
    if (body.mom_id === null || body.mom_id === '') changes.mom_id = null;
    else {
      const mom = db.prepare('SELECT id FROM moms WHERE id = ?').get(positiveId(body.mom_id, 'Mom'));
      if (!mom) throw new HttpError(400, 'That Mom does not exist.');
      changes.mom_id = mom.id;
    }
  }
  if ('price_usd' in body) {
    if (body.price_usd === null || body.price_usd === '') changes.price_usd = null;
    else {
      const price = Number(body.price_usd);
      if (!Number.isFinite(price) || price < 0 || price > 100000) throw new HttpError(400, 'Price is invalid.');
      changes.price_usd = Math.round(price * 100) / 100;
    }
  }
  if ('payment_link' in body) changes.payment_link = httpsUrl(body.payment_link, 'Whish payment link');

  const price = 'price_usd' in changes ? changes.price_usd : order.price_usd;
  const link = 'payment_link' in changes ? changes.payment_link : order.payment_link;
  let status = order.status;
  if (body.status != null && body.status !== '') {
    if (!(body.status in STATUSES)) throw new HttpError(400, 'Unknown status.');
    status = body.status;
  }
  // Entering a price and a Whish link on a collected order moves it to "awaiting payment".
  if (status === order.status && price != null && link && ['booked', 'picked_up'].includes(order.status)) status = 'priced';
  if (status === 'priced' && (price == null || !link)) {
    throw new HttpError(400, 'Add the price and the Whish payment link before marking the order as priced.');
  }
  changes.status = status;
  if (status === 'paid' && order.status !== 'paid') changes.paid_at = new Date().toISOString();

  const note = text(body.note, 'Note', { max: 300 });
  const columns = Object.keys(changes);
  db.prepare(`UPDATE orders SET ${columns.map((c) => `${c} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`)
    .run(...columns.map((c) => changes[c]), id);
  if (status !== order.status || note) addEvent(id, status, note);
  return serializeOrders([db.prepare(`${ORDER_SELECT} WHERE o.id = ?`).get(id)])[0];
}

function parseMomBody(body) {
  const s = settings();
  const areas = Array.isArray(body.areas) ? body.areas.filter((a) => s.areas.includes(a)) : [];
  return {
    name: text(body.name, 'Name', { max: 60, required: true }),
    phone: body.phone ? normalizePhone(body.phone) : '',
    areas: JSON.stringify([...new Set(areas)]),
    bio: text(body.bio, 'Bio', { max: 300 }),
    active: body.active === false ? 0 : 1,
  };
}

function listMoms() {
  const rows = db.prepare(`
    SELECT m.*, (SELECT COUNT(*) FROM orders o WHERE o.mom_id = m.id AND o.status NOT IN ('delivered', 'cancelled')) AS open_orders
    FROM moms m ORDER BY m.active DESC, m.name
  `).all();
  return { moms: rows.map(parseMom) };
}

function createApplication(body) {
  const s = settings();
  const name = text(body.name, 'Name', { max: 80, required: true });
  const phone = normalizePhone(body.phone, 'WhatsApp number');
  const area = parseArea(body.area, s);
  const experience = text(body.experience, 'About you', { max: 1000 });
  db.prepare('INSERT INTO applications (name, phone, area, experience, has_car) VALUES (?, ?, ?, ?, ?)')
    .run(name, phone, area, experience, body.has_car ? 1 : 0);
  return { ok: true };
}

function saveSettings(body) {
  const next = {
    areas: stringList(body.areas, 'Areas'),
    slots: stringList(body.slots, 'Pickup times', { pattern: /^\d{2}:\d{2}-\d{2}:\d{2}$/, max: 24 }),
    item_types: stringList(body.item_types, 'Clothes types', { max: 40 }),
    slot_capacity: Number(body.slot_capacity),
    business_whatsapp: body.business_whatsapp ? normalizePhone(body.business_whatsapp, 'Business WhatsApp') : '',
    business_email: text(body.business_email, 'Email', { max: 120 }),
    site_url: httpsUrl(body.site_url, 'Website address').replace(/\/$/, ''),
  };
  if (!Number.isInteger(next.slot_capacity) || next.slot_capacity < 1 || next.slot_capacity > 50) {
    throw new HttpError(400, 'Orders per Mom per time slot must be between 1 and 50.');
  }
  if (next.business_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.business_email)) {
    throw new HttpError(400, 'Email address is invalid.');
  }
  for (const [key, value] of Object.entries(next)) setSetting(key, value);
  return settings();
}

function publicConfig() {
  const s = settings();
  return {
    areas: s.areas,
    slots: s.slots,
    item_types: s.item_types,
    business_whatsapp: s.business_whatsapp,
    business_email: s.business_email,
    today: beirutNow().date,
    booking_days: BOOKING_DAYS,
  };
}

// ---------- HTTP plumbing ----------

async function readJson(req) {
  if (!(req.headers['content-type'] || '').includes('application/json')) throw new HttpError(415, 'Expected JSON.');
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) throw new HttpError(413, 'Request is too large.');
    chunks.push(chunk);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw new HttpError(400, 'Invalid JSON.');
  }
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(data));
}

async function handleApi(req, res, url) {
  const { pathname, searchParams } = url;
  const route = `${req.method} ${pathname}`;
  const ip = clientIp(req);

  switch (route) {
    case 'GET /api/config':
      return publicConfig();
    case 'GET /api/moms': {
      const area = parseArea(searchParams.get('area'), settings());
      return { moms: activeMomsInArea(area).map(({ id, name, bio }) => ({ id, name, bio })) };
    }
    case 'GET /api/availability':
      return availability(searchParams);
    case 'POST /api/orders':
      rateLimit(`order:${ip}`, 10, 60 * 60 * 1000);
      return createOrder(await readJson(req));
    case 'GET /api/track':
      rateLimit(`track:${ip}`, 40, 10 * 60 * 1000);
      return trackOrder(searchParams);
    case 'POST /api/applications':
      rateLimit(`apply:${ip}`, 5, 60 * 60 * 1000);
      return createApplication(await readJson(req));

    case 'POST /api/admin/login': {
      rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
      const { password } = await readJson(req);
      if (!verifyPassword(password ?? '', getSetting('admin_password_hash', null))) throw new HttpError(401, 'Wrong password.');
      const token = crypto.randomBytes(32).toString('base64url');
      db.prepare('INSERT INTO sessions (token_hash, expires_at) VALUES (?, ?)')
        .run(sha256(token), Date.now() + SESSION_DAYS * 86400000);
      res.setHeader('set-cookie', sessionCookie(req, token, SESSION_DAYS * 86400));
      return { ok: true };
    }
    case 'POST /api/admin/logout': {
      const token = parseCookies(req).admin_session;
      if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
      res.setHeader('set-cookie', sessionCookie(req, '', 0));
      return { ok: true };
    }
  }

  if (!pathname.startsWith('/api/admin/')) throw new HttpError(404, 'Not found.');
  requireAdmin(req);

  switch (route) {
    case 'GET /api/admin/me':
      return { ok: true };
    case 'GET /api/admin/orders':
      return listOrders(searchParams);
    case 'GET /api/admin/moms':
      return listMoms();
    case 'POST /api/admin/moms': {
      const mom = parseMomBody(await readJson(req));
      db.prepare('INSERT INTO moms (name, phone, areas, bio, active) VALUES (?, ?, ?, ?, ?)')
        .run(mom.name, mom.phone, mom.areas, mom.bio, mom.active);
      return listMoms();
    }
    case 'GET /api/admin/applications':
      return { applications: db.prepare('SELECT * FROM applications ORDER BY id DESC LIMIT 500').all() };
    case 'GET /api/admin/settings':
      return settings();
    case 'PUT /api/admin/settings':
      return saveSettings(await readJson(req));
    case 'POST /api/admin/password': {
      const body = await readJson(req);
      if (!verifyPassword(body.current ?? '', getSetting('admin_password_hash', null))) {
        throw new HttpError(400, 'Current password is wrong.');
      }
      if (typeof body.next !== 'string' || body.next.length < 10) {
        throw new HttpError(400, 'New password must be at least 10 characters.');
      }
      setSetting('admin_password_hash', hashPassword(body.next));
      return { ok: true };
    }
  }

  let match;
  if (req.method === 'PATCH' && (match = pathname.match(/^\/api\/admin\/orders\/(\d+)$/))) {
    return { order: updateOrder(Number(match[1]), await readJson(req)) };
  }
  if (req.method === 'PATCH' && (match = pathname.match(/^\/api\/admin\/moms\/(\d+)$/))) {
    const id = Number(match[1]);
    if (!db.prepare('SELECT 1 FROM moms WHERE id = ?').get(id)) throw new HttpError(404, 'Mom not found.');
    const mom = parseMomBody(await readJson(req));
    db.prepare('UPDATE moms SET name = ?, phone = ?, areas = ?, bio = ?, active = ? WHERE id = ?')
      .run(mom.name, mom.phone, mom.areas, mom.bio, mom.active, id);
    return listMoms();
  }
  if (req.method === 'PATCH' && (match = pathname.match(/^\/api\/admin\/applications\/(\d+)$/))) {
    const { status } = await readJson(req);
    if (!APPLICATION_STATUSES.includes(status)) throw new HttpError(400, 'Unknown status.');
    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, Number(match[1]));
    return { ok: true };
  }
  throw new HttpError(404, 'Not found.');
}

// ---------- static pages ----------

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const partialCache = new Map();

async function partial(name) {
  if (PRODUCTION && partialCache.has(name)) return partialCache.get(name);
  const html = await readFile(path.join(PUBLIC_DIR, 'partials', `${name}.html`), 'utf8');
  partialCache.set(name, html);
  return html;
}

async function renderPage(html) {
  for (const name of ['head', 'header', 'footer']) {
    const marker = `<!-- @${name} -->`;
    if (html.includes(marker)) html = html.replace(marker, await partial(name));
  }
  return html;
}

async function servePage(req, res, status, file) {
  const ext = path.extname(file);
  let body = await readFile(file);
  if (ext === '.html') body = await renderPage(body.toString('utf8'));
  res.writeHead(status, {
    'content-type': CONTENT_TYPES[ext] || 'application/octet-stream',
    'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
  });
  res.end(req.method === 'HEAD' ? undefined : body);
}

async function serveStatic(req, res, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    throw new HttpError(400, 'Bad request');
  }
  if (rel.endsWith('/')) rel += 'index.html';
  else if (!path.extname(rel)) rel += '.html';
  const file = path.join(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR + path.sep) || rel.startsWith('/partials/')) throw new HttpError(404, 'Not found');
  try {
    await servePage(req, res, 200, file);
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'EISDIR') throw new HttpError(404, 'Not found');
    throw err;
  }
}

function setSecurityHeaders(res) {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader(
    'content-security-policy',
    "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
}

const server = http.createServer(async (req, res) => {
  setSecurityHeaders(res);
  const url = new URL(req.url, 'http://localhost');
  const isApi = url.pathname.startsWith('/api/');
  try {
    if (isApi) {
      sendJson(res, 200, await handleApi(req, res, url));
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed');
    await serveStatic(req, res, url.pathname);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error(err);
    if (res.headersSent) return res.end();
    if (isApi) return sendJson(res, status, { error: status === 500 ? 'Server error. Please try again.' : err.message });
    if (status === 404) return servePage(req, res, 404, path.join(PUBLIC_DIR, '404.html')).catch(() => res.end());
    res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(err.message);
  }
});

initAdminPassword();
server.listen(PORT, HOST, () => console.log(`10x MoM running at http://${HOST}:${PORT}`));
