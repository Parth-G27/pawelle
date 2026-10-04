// What the owner reads. The model only chooses ids and writes one summary; every other word
// here is written by us, in Pawelle's voice (Constitution IX).
import { PLAY_IDEAS, REASONS } from './planSchema.js'

export const DISCLAIMER = 'Pawelle is not a vet.'

export const possessive = (name) => (/s$/i.test(name) ? `${name}'` : `${name}'s`)

const FOOD = { dry: 'dry food', wet: 'wet food', mixed: 'mix of dry and wet food', raw: 'raw food', home: 'home-cooked food' }
export const foodPhrase = (name, diet) => `${possessive(name)} usual ${FOOD[diet] ?? 'food'}`

export const AMOUNT_WORDS = {
  usual: 'your usual amount',
  a_little_less: 'a little less than usual',
  a_little_more: 'a little more than usual',
}
export const TIME_LABELS = { morning: 'Morning', midday: 'Midday', evening: 'Evening', bedtime: 'Bedtime' }

const fill = (text, name) => text.replaceAll('{name}', name)
const sentenceList = (items) => {
  const l = items.map((x) => x.toLowerCase())
  return l.length <= 1 ? (l[0] ?? '') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`
}

// Fixed reminders, never written by the model.
export function vetReminders(name) {
  return [
    'Not eating for more than a day.',
    'Vomiting more than once, or any blood in vomit or stool.',
    'Trouble breathing, collapse or a seizure.',
    'Straining at the litter box, or no pee for a day.',
    `Anything that worries you. You know ${name} best.`,
  ]
}

// Watch-outs from today's check-in (maximum 3). Calm, plain, no emoji.
export function buildWatchOuts({ name, checkin, flags = [] }) {
  const out = []
  if (flags.some((f) => f.code === 'not_eating')) {
    out.push(`${name} didn't want food today, so offer the usual meals calmly and keep a gentle eye on ${name}.`)
  }
  if (flags.some((f) => f.code === 'litter_off')) {
    out.push('Something looked different at the litter box today, so keep a gentle eye on it.')
  }
  if (checkin?.appetite === 'low') {
    out.push(`${possessive(name)} appetite was low today. Offer the usual food calmly, and see how tomorrow goes.`)
  }
  if (checkin?.mood === 'grumpy' || checkin?.mood === 'hiding') {
    out.push(`${name} seems a little off today. A quiet, cosy spot may help.`)
  }
  return out.slice(0, 3)
}

const TOPICS = { not_eating: 'not eating', litter_off: 'the litter box' }

// "Good to check with your vet" (maximum 3). Added by the app, so a small model cannot skip it.
export function buildAskVet({ name, conditions, flags = [], allergies }) {
  const out = []
  if (conditions?.length) {
    out.push(`Because ${name} has health conditions on file (${sentenceList(conditions)}), please check any change in food or routine with your vet.`)
  }
  const topics = flags.map((f) => TOPICS[f.code]).filter(Boolean)
  if (topics.length) {
    out.push(`Since ${topics.join(' and ')} came up today, it's worth a chat with your vet if it continues.`)
  }
  if (allergies === null || allergies === undefined) {
    out.push(`I don't know about ${possessive(name)} allergies yet. Adding them on the profile helps me keep meals safe.`)
  }
  return out.slice(0, 3)
}

// A stored plan row + the cat -> what the app shows.
export function renderPlan({ row, pet, stale }) {
  const c = JSON.parse(row.content)
  const reasonText = (group, id) => fill(group.find((r) => r.id === id)?.text ?? '', pet.name)
  return {
    id: row.id,
    date: row.date,
    source: row.source,
    model: row.model,
    reason: row.reason,
    stale: Boolean(stale),
    summary: c.summary,
    meals: c.meals.map((m) => ({
      time: m.time,
      label: TIME_LABELS[m.time],
      what: foodPhrase(pet.name, pet.diet_type),
      portion: AMOUNT_WORDS[m.amount],
      why: reasonText(REASONS.meal, m.reason),
    })),
    play: c.play.map((p) => ({
      idea: p.idea,
      label: PLAY_IDEAS.find((i) => i.id === p.idea)?.label ?? p.idea,
      minutes: p.minutes,
      why: reasonText(REASONS.play, p.reason),
    })),
    watch_outs: c.watch_outs ?? [],
    ask_vet: c.ask_vet ?? [],
    vet_reminders: vetReminders(pet.name),
    disclaimer: DISCLAIMER,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
