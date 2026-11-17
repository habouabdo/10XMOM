export const TIMEZONE = 'Asia/Beirut';
export const BOOKING_DAYS = 14;

// All booking times are Beirut time.
export function beirutNow(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(now).map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function slotStartMinutes(slot: string): number {
  const [h, m] = slot.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

// A slot can be booked up to an hour before it starts, and at most BOOKING_DAYS ahead.
export function isSlotOpen(date: string, slot: string, now = beirutNow()): boolean {
  if (date < now.date || date > addDays(now.date, BOOKING_DAYS)) return false;
  return date !== now.date || slotStartMinutes(slot) >= now.minutes + 60;
}
