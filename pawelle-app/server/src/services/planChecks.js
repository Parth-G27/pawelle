// Everything the model writes is checked here, by code, before the owner sees it.
// Pure functions: no database, no network.
import { loadJson } from '../lib/data.js'
import { PLAY_IDEAS, REASONS, planSchema } from './planSchema.js'

const ALIASES = loadJson('allergen-aliases.json')
const BRANDS = loadJson('brands.json')
const DANGER = loadJson('danger-terms.json')

export const MAX_EMOJI = 3
const TIME_ORDER = ['morning', 'midday', 'evening', 'bedtime']

const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
const wordRe = (terms) => new RegExp(`(^|[^a-z0-9])(${terms.map(escapeRe).join('|')})([^a-z0-9]|$)`, 'i')

// ---- text rules (summary only) ---------------------------------------------------

const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|org|net|io|co|uk|edu|gov|info|app)\b)/i
const SOURCE = wordRe([
  'according to', 'studies', 'study shows', 'research shows', 'researchers', 'experts say',
  'experts agree', 'scientists', 'clinically', 'proven',
])
const CERTAINTY = wordRe([
  'definitely', 'guaranteed', 'guarantee', 'certainly', 'always works', 'cure', 'cures',
  'cured', 'will fix', 'no doubt',
])
const MEDICINE = wordRe([
  'medicine', 'medication', 'medications', 'dose', 'dosage', 'tablet', 'tablets', 'pill',
  'pills', 'antibiotic', 'antibiotics', 'prescription', 'prescribe', 'prescribed',
  'supplement', 'supplements', 'vaccine', 'vaccines', 'vaccination', 'mg',
  ...DANGER.human_medicine,
])
const DIAGNOSIS_TERMS = [
  'diagnosis', 'diagnose', 'diagnosed', 'infection', 'infected', 'disease', 'cancer', 'tumor',
  'tumour', 'parasite', 'parasites', 'worms', 'uti', 'arthritis', 'diabetes', 'kidney failure',
  'kidney disease', 'illness', 'syndrome',
]
const NUMBERS = /\b\d+(\.\d+)?\s?(g|gr|grams?|kg|kilos?|oz|ounces?|ml|l|cups?|tbsp|tsp|kcal|calories?|cal|%|percent|lbs?|pounds?)\b|\bcalories?\b|[$£€]\s?\d/i
const BRAND = wordRe(BRANDS)

// Strip markup and markdown, then keep at most MAX_EMOJI emoji.
export function sanitizeText(text) {
  let out = String(text ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/[*_`#~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  let seen = 0
  out = out.replace(/\p{Extended_Pictographic}️?/gu, (m) => (++seen <= MAX_EMOJI ? m : ''))
  return out.replace(/\s+/g, ' ').trim()
}

// Keep up to two complete sentences from the START of the text, within `max` characters
// (a small model often runs on). Never starts mid-text, so nothing can be "trimmed into" shape.
export function trimSummary(text, max = 200, maxSentences = 2) {
  const end = /[.!?]+(?=\s|$)/g
  let out = ''
  let count = 0
  let m
  while (count < maxSentences && (m = end.exec(text))) {
    const candidate = text.slice(0, m.index + m[0].length).trim()
    if (candidate.length > max) break
    out = candidate
    count += 1
  }
  if (out) return out
  const cut = text.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > 40 ? cut.slice(0, space) : cut).replace(/[,;:\s]+$/, '')}…`
}

export const countEmoji = (text) => (String(text).match(/\p{Extended_Pictographic}/gu) ?? []).length

// Allergy words plus aliases, as one matcher. allergies: array | null.
export function allergenMatcher(allergies) {
  if (!allergies?.length) return null
  const terms = new Set()
  for (const raw of allergies) {
    const a = raw.trim().toLowerCase()
    if (!a) continue
    terms.add(a)
    terms.add(a.endsWith('s') ? a.slice(0, -1) : `${a}s`)
    for (const [key, list] of Object.entries(ALIASES)) {
      const k = key.endsWith('s') ? key.slice(0, -1) : key
      const base = a.endsWith('s') ? a.slice(0, -1) : a
      if (base === k) list.forEach((x) => terms.add(x))
    }
  }
  const list = [...terms].filter((t) => t.length > 1)
  return list.length ? wordRe(list) : null
}

// kinds of problem found in the summary: link, source, certainty, brand, medicine,
// diagnosis, numbers, allergen. Words that match the owner's own conditions are allowed.
const HE = ['he', 'him', 'his', 'himself', "he's", "he'll", "he'd"]
const SHE = ['she', 'her', 'hers', 'herself', "she's", "she'll", "she'd"]
const wordsRe = (list) => new RegExp(`(^|[^a-z'])(${list.join('|')})([^a-z']|$)`, 'i')
// Pronouns only when the owner said the cat's sex; otherwise the name is used.
const wrongPronoun = (text, sex) =>
  sex === 'female' ? wordsRe(HE).test(text) : sex === 'male' ? wordsRe(SHE).test(text) : wordsRe([...HE, ...SHE]).test(text)

// Things a small model gets wrong about the cat: pronouns the owner did not choose, a wrong life
// stage ("the kitten" for a grown cat), and times of day (it does not know the time).
const STAGE_WORDS = { kitten: /\bkittens?\b/i, senior: /\b(senior|elderly|golden years)\b/i }
const TIME_OF_DAY = /\b(afternoon|evening|tonight|night|bedtime)\b/i
function sentenceIsOff(sentence, { sex, lifeStage }) {
  if (wrongPronoun(sentence, sex)) return true
  if (lifeStage !== 'kitten' && STAGE_WORDS.kitten.test(sentence)) return true
  if (lifeStage !== 'senior' && STAGE_WORDS.senior.test(sentence)) return true
  return TIME_OF_DAY.test(sentence)
}

// Drop only the sentences that are off; keep the rest. Returns '' when nothing usable is left.
export function repairSummary(text, ctx) {
  const sentences = text.match(/[^.!?]*[.!?]+(?=\s|$)|[^.!?]+$/g) ?? [text]
  return sentences.map((s) => s.trim()).filter((s) => s && !sentenceIsOff(s, ctx)).join(' ')
}

export function checkSummary(text, { allergies = null, conditions = null } = {}) {
  const problems = []
  if (LINK.test(text)) problems.push('link')
  if (SOURCE.test(text)) problems.push('source')
  if (CERTAINTY.test(text)) problems.push('certainty')
  if (BRAND.test(text)) problems.push('brand')
  if (MEDICINE.test(text)) problems.push('medicine')
  if (NUMBERS.test(text)) problems.push('numbers')
  const own = (conditions ?? []).join(' ').toLowerCase()
  const diagnosis = DIAGNOSIS_TERMS.filter((t) => !own.includes(t.split(' ')[0]))
  if (diagnosis.length && wordRe(diagnosis).test(text)) problems.push('diagnosis')
  const allergen = allergenMatcher(allergies)
  if (allergen && allergen.test(text)) problems.push('allergen')
  return problems
}

// ---- structure repair --------------------------------------------------------------

export function reasonApplies(reason, ctx) {
  const a = reason.appliesTo
  if (!a) return true
  if (a.needsCheckin) return Boolean(ctx.hasCheckin)
  const tests = []
  if (a.stages) tests.push(a.stages.includes(ctx.lifeStage))
  if (a.appetite) tests.push(a.appetite.includes(ctx.appetite))
  if (a.energy) tests.push(a.energy.includes(ctx.energy))
  if (a.mood) tests.push(a.mood.includes(ctx.mood))
  return a.anyOf ? tests.some(Boolean) : tests.every(Boolean)
}

const isWeightCondition = (conditions) =>
  (conditions ?? []).some((c) => /overweight|obes|diabet/i.test(c))

const mealCap = (stage) => (stage === 'adult' || stage === 'unknown' ? 2 : 3)

// Repair instead of reject: keep what is good, fix what a small model gets wrong.
export function normalisePlan(plan, ctx) {
  const lowAppetite = ctx.appetite === 'low' || ctx.appetite === 'none'
  // "a little more" only for a hungry, lively or growing cat, and at most once a day
  const allowMore =
    !lowAppetite && !isWeightCondition(ctx.conditions) &&
    (ctx.appetite === 'great' || ctx.energy === 'high' || ctx.lifeStage === 'kitten')
  let usedMore = false
  const mealReasonFor = (id) => {
    const found = REASONS.meal.find((r) => r.id === id)
    if (found && reasonApplies(found, ctx)) return id
    return (lowAppetite ? 'gentle_appetite' : 'routine')
  }
  const playReasonFor = (id) => {
    const found = REASONS.play.find((r) => r.id === id)
    return found && reasonApplies(found, ctx) ? id : 'short_bursts'
  }

  // meals: one per time of day, in order, capped by life stage
  const byTime = new Map()
  for (const m of plan.meals) if (!byTime.has(m.time)) byTime.set(m.time, m)
  const meals = [...byTime.values()]
    .sort((a, b) => TIME_ORDER.indexOf(a.time) - TIME_ORDER.indexOf(b.time))
    .slice(0, mealCap(ctx.lifeStage))
    .map((m) => ({
      time: m.time,
      amount: m.amount === 'a_little_more' ? (allowMore && !usedMore ? ((usedMore = true), 'a_little_more') : 'usual') : m.amount,
      reason: mealReasonFor(m.reason),
    }))
  // a grown-up cat's two meals are morning and evening
  if ((ctx.lifeStage === 'adult' || ctx.lifeStage === 'unknown') && meals.length === 2) {
    meals[0].time = 'morning'
    meals[1].time = 'evening'
  }

  // play: no repeats; gentle ideas only when tired, hiding or senior; minutes snapped and capped
  const gentleOnly = ctx.energy === 'sleepy' || ctx.mood === 'hiding' || ctx.lifeStage === 'senior'
  const cap = ctx.energy === 'sleepy' || ctx.mood === 'hiding' ? 10 : ctx.lifeStage === 'kitten' || ctx.lifeStage === 'senior' ? 15 : 30
  const seen = new Set()
  const play = []
  for (const p of plan.play) {
    const idea = PLAY_IDEAS.find((i) => i.id === p.idea)
    if (!idea || seen.has(p.idea) || (gentleOnly && idea.energetic)) continue
    seen.add(p.idea)
    play.push({
      idea: p.idea,
      minutes: Math.max(5, Math.min(cap, Math.round(p.minutes / 5) * 5)),
      reason: playReasonFor(p.reason),
    })
  }
  if (play.length === 0) {
    play.push({ idea: 'feather_wand', minutes: Math.min(10, cap), reason: 'short_bursts' })
  }
  return { summary: plan.summary, meals, play }
}

// ---- the whole gate ----------------------------------------------------------------
// raw: whatever the model returned. ctx: { name, allergies, conditions, lifeStage,
// energy, mood, appetite, hasCheckin, sex }.  -> { ok, plan, problems }
export function checkPlan(raw, ctx) {
  const parsed = planSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, plan: null, problems: ['shape'] }
  // Check everything the model wrote, THEN trim for display, so trimming can never hide a problem.
  const full = sanitizeText(parsed.data.summary)
  const problems = checkSummary(full, ctx)
  let summary = trimSummary(repairSummary(full, ctx))
  if (summary.length < 10) problems.push('wording')
  // Voice rule: the cat's name is always used. If the model forgot it, we open with it.
  if (summary && ctx.name && !summary.toLowerCase().includes(ctx.name.toLowerCase())) {
    summary = trimSummary(`Here's today's plan for ${ctx.name}! ${summary}`)
  }
  if (problems.length) return { ok: false, plan: null, problems }
  return { ok: true, plan: normalisePlan({ ...parsed.data, summary }, ctx), problems: [] }
}
