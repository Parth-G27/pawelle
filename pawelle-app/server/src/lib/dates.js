const pad = (n) => String(n).padStart(2, '0')

export const isoOf = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
export const utcToday = (now = new Date()) => isoOf(now)

// Add (or subtract) whole days to an ISO date, using UTC so there are no DST surprises.
export function addDaysIso(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  return isoOf(new Date(Date.UTC(y, m - 1, d + n)))
}

// A real YYYY-MM-DD date, from 2020-01-01 to tomorrow (UTC), which covers every time zone.
// Returns { ok: true, date } or { ok: false, message }.
export function parseCheckinDate(value, now = new Date()) {
  const bad = { ok: false, message: "That date doesn't look right. Please try again." }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return bad
  const [y, m, d] = value.split('-').map(Number)
  const real = new Date(Date.UTC(y, m - 1, d))
  if (isoOf(real) !== value) return bad
  if (value < '2020-01-01') return bad
  if (value > addDaysIso(utcToday(now), 1)) {
    return { ok: false, message: "Check-ins can't be saved for a day that hasn't started yet." }
  }
  return { ok: true, date: value }
}
