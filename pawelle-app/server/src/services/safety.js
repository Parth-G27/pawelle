// Deterministic safety rules. No AI is involved, and the model never improvises on these.
// Every flag is { code, level, message }. level is 'attention' (amber) or 'urgent' (red).
// Feature 003 extends this file with text-based rules using the same shape.
import { addDaysIso } from '../lib/dates.js'
import { loadJson } from '../lib/data.js'

const NOT_A_VET = 'Pawelle is not a vet.'

// checkin: the day being looked at. previous: the stored check-in for any earlier day (or null).
// "Two days in a row" only counts when previous is exactly the previous calendar day.
export function checkinFlags(checkin, previous, petName) {
  const name = petName?.trim() || 'Your cat'
  const flags = []

  if (checkin.appetite === 'none') {
    const twoDays = previous?.appetite === 'none' && previous.date === addDaysIso(checkin.date, -1)
    flags.push(
      twoDays
        ? {
            code: 'not_eating_2d',
            level: 'urgent',
            message: `${name} hasn't eaten for two days in a row. Please call your vet today, because cats shouldn't go without food for long. ${NOT_A_VET}`,
          }
        : {
            code: 'not_eating',
            level: 'attention',
            message: `${name} isn't eating today. Keep an eye on ${name}, and call your vet if it carries on. ${NOT_A_VET}`,
          },
    )
  }

  if (checkin.litter === 'off') {
    flags.push({
      code: 'litter_off',
      level: 'attention',
      message: `Something looks different at ${name}'s litter box. Changes there are worth watching, and worth a call to your vet if they continue. ${NOT_A_VET}`,
    })
  }

  return flags
}

// ---- Dangerous words in notes (feature 003) ----------------------------------------

const DANGER = loadJson('danger-terms.json')

const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
const MATCHERS = Object.entries(DANGER).flatMap(([category, terms]) =>
  terms.map((term) => ({
    category,
    term,
    re: new RegExp(`(^|[^a-z])${escapeRe(term)}([^a-z]|$)`),
  })),
)

const normalise = (text) => text.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ')

const DANGER_MESSAGES = {
  toxic_food: (t) => `Your note mentions ${t}. Some foods can be dangerous for cats. Please contact your vet or an emergency clinic right now.`,
  toxic_plant: (t) => `Your note mentions ${t}. Some plants can be dangerous for cats. Please contact your vet or an emergency clinic right now.`,
  chemical: (t) => `Your note mentions ${t}. Some household products and chemicals can be dangerous for cats. Please contact your vet or an emergency clinic right now.`,
  human_medicine: (t) => `Your note mentions ${t}. Human medicines can be very dangerous for cats. Please contact your vet or an emergency clinic right now.`,
  emergency: (t) => `Your note mentions "${t}". That could be an emergency. Please contact your vet or an emergency clinic right now.`,
}

// text -> urgent flags, at most one per category (the first match), with fixed calm wording.
export function textFlags(text) {
  if (!text || typeof text !== 'string') return []
  const t = normalise(text)
  const seen = new Set()
  const flags = []
  for (const m of MATCHERS) {
    if (seen.has(m.category) || !m.re.test(t)) continue
    seen.add(m.category)
    flags.push({
      code: 'danger_term',
      level: 'urgent',
      category: m.category,
      term: m.term,
      message: `${DANGER_MESSAGES[m.category](m.term)} If you wrote it by mistake, you can edit today's note. ${NOT_A_VET}`,
    })
  }
  return flags
}

// Runs BEFORE any model call. Only today's check-in decides; yesterday's note also counts.
// Returns { blocked, flags }. When blocked, only the urgent flags are returned.
export function planSafety({ today, yesterday, petName }) {
  const flags = []
  if (today) flags.push(...checkinFlags(today, yesterday ?? null, petName))
  for (const source of [today, yesterday]) {
    for (const f of textFlags(source?.note)) {
      if (!flags.some((x) => x.code === f.code && x.term === f.term)) flags.push(f)
    }
  }
  const blocked = flags.some((f) => f.level === 'urgent')
  return { blocked, flags: blocked ? flags.filter((f) => f.level === 'urgent') : flags }
}
