const daysInMonth = (year, monthIndex) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
const pad = (n) => String(n).padStart(2, '0')

export const todayIso = (now = new Date()) => now.toISOString().slice(0, 10)

// "About 2 years and 3 months" -> an estimated ISO birthdate.
export function approxToBirthdate(years, months, today = new Date()) {
  const total = Number(years || 0) * 12 + Number(months || 0)
  let year = today.getUTCFullYear()
  let monthIndex = today.getUTCMonth() - total
  year += Math.floor(monthIndex / 12)
  monthIndex = ((monthIndex % 12) + 12) % 12
  const day = Math.min(today.getUTCDate(), daysInMonth(year, monthIndex))
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
}

// An ISO birthdate -> { years, months } as of today.
export function birthdateToApprox(iso, today = new Date()) {
  const [by, bm, bd] = iso.split('-').map(Number)
  let months = (today.getUTCFullYear() - by) * 12 + (today.getUTCMonth() + 1 - bm)
  if (today.getUTCDate() < bd) months -= 1
  months = Math.max(0, months)
  return { years: Math.floor(months / 12), months: months % 12 }
}

export function describeAge({ years, months }) {
  const parts = []
  if (years) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`)
  if (months) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`)
  return parts.length ? parts.join(' ') : 'under 1 month'
}
