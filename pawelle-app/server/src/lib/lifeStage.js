// kitten: under 1 year. adult: 1 to 10 years. senior: 11 years and over. unknown: no age.
export function ageInMonths(birthdate, today = new Date()) {
  if (!birthdate) return null
  const [by, bm, bd] = birthdate.split('-').map(Number)
  let months = (today.getUTCFullYear() - by) * 12 + (today.getUTCMonth() + 1 - bm)
  if (today.getUTCDate() < bd) months -= 1
  return Math.max(0, months)
}

export function lifeStage(birthdate, today = new Date()) {
  const months = ageInMonths(birthdate, today)
  if (months === null) return 'unknown'
  if (months < 12) return 'kitten'
  if (months < 132) return 'adult'
  return 'senior'
}

export function describeAge(birthdate, estimated, today = new Date()) {
  const months = ageInMonths(birthdate, today)
  if (months === null) return null
  const y = Math.floor(months / 12)
  const m = months % 12
  const parts = []
  if (y) parts.push(`${y} ${y === 1 ? 'year' : 'years'}`)
  if (m && y < 3) parts.push(`${m} ${m === 1 ? 'month' : 'months'}`)
  const text = parts.length ? parts.join(' ') : 'under 1 month'
  return `${estimated ? 'about ' : ''}${text}`
}
