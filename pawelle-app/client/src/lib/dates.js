// Check-ins use the owner's LOCAL calendar day (unlike lib/age.js, which is UTC).
const pad = (n) => String(n).padStart(2, '0')
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parse = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const localToday = (now = new Date()) => isoOf(now)

export function addDays(iso, n) {
  const d = parse(iso)
  d.setDate(d.getDate() + n)
  return isoOf(d)
}

// The last n days, oldest first, ending with today.
export function lastNDays(n, today) {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)))
}

export const weekday = (iso) => WEEKDAYS[parse(iso).getDay()]

// "Today", "Yesterday", then "Mon 5 Oct".
export function formatDay(iso, today) {
  if (iso === today) return 'Today'
  if (iso === addDays(today, -1)) return 'Yesterday'
  const d = parse(iso)
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}
