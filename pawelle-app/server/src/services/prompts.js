// One prompt in, one validated answer out. No tools, no agents.
import { loadJson } from '../lib/data.js'
import { PLAY_IDEAS, REASONS } from './planSchema.js'

const FACTS = loadJson('cat-knowledge.json').facts

const APPETITE = { great: 'great', normal: 'normal', low: 'low', none: 'not eating' }
const LITTER = { normal: 'normal', off: 'something looked off' }

export function buildSystemMessage() {
  const reasons = (list) => list.map((r) => `${r.id} = ${r.text.replaceAll("{name}", 'the cat')}`).join('; ')
  const ideas = PLAY_IDEAS.map((i) => `${i.id} = ${i.label}`).join('; ')
  return [
    'You are Pawelle, a warm, upbeat friend who adores cats. You help plan a cat\'s day.',
    '',
    'Your job:',
    "1. Write one short, friendly summary (1 or 2 short sentences) about today for the cat. Use the cat's name. Be kind and playful, with at most one gentle pun and at most 3 emoji. Never blame the owner.",
    '2. Choose meal times, amounts, play ideas and reasons ONLY from the options below.',
    '',
    'Rules:',
    "- Use only the facts below and the cat's own information. Do not add anything else.",
    '- In the summary never mention food names, numbers, medicines, illnesses, links, brands, or claims of certainty.',
    '',
    'Facts:',
    ...FACTS.map((f) => `- ${f}`),
    '',
    `Meal reasons (use the id): ${reasons(REASONS.meal)}.`,
    `Play ideas (use the id): ${ideas}.`,
    `Play reasons (use the id): ${reasons(REASONS.play)}.`,
    'Amounts: usual, a_little_less, a_little_more. Times: morning, midday, evening, bedtime.',
    'Use at most 2 meals for a grown-up cat. Keep play short and gentle if the cat is tired.',
    "Do not mention the time of day, and only call the cat a kitten or senior if the cat information says so.",
  ].join('\n')
}

const answered = (parts) => parts.filter(Boolean).join(', ')

function describeCheckin(c) {
  if (!c) return null
  return answered([
    c.mood && `mood ${c.mood}`,
    c.appetite && `appetite ${APPETITE[c.appetite]}`,
    c.energy && `energy ${c.energy}`,
    c.play_minutes !== null && c.play_minutes !== undefined && `play ${c.play_minutes === 0 ? 'none' : `about ${c.play_minutes} min`}`,
    c.litter && `litter box ${LITTER[c.litter]}`,
  ])
}

// Only structured profile fields, check-in answers and heads-ups. Never photos, and never the
// owner's free-text notes: those are scanned for danger words by code, not given to the model.
export function buildContext({ pet, date, today, recent = [], flags = [], stage, ageText }) {
  const name = pet.name
  const lines = []
  const who = [
    pet.sex === 'female' ? 'Girl' : pet.sex === 'male' ? 'Boy' : null,
    pet.neutered === 'yes' ? 'neutered or spayed' : null,
  ].filter(Boolean)
  lines.push(
    `Cat: ${name}.${who.length ? ` ${who.join(', ')}.` : ''} ${ageText ? `Age ${ageText} (${stage}).` : 'Age not known.'}` +
      `${pet.weight_kg ? ` Weight ${pet.weight_kg} kg.` : ''} Activity: ${pet.activity_level}.` +
      `${pet.diet_type && pet.diet_type !== 'unknown' ? ` Usual food: ${pet.diet_type}.` : ''}`,
  )
  lines.push(
    pet.allergies === null
      ? 'Allergies: NOT KNOWN YET.'
      : pet.allergies.length === 0
        ? 'Allergies: none.'
        : `Allergies (never mention these foods): ${pet.allergies.join(', ')}.`,
  )
  lines.push(
    pet.conditions === null
      ? 'Health conditions: not known.'
      : pet.conditions.length === 0
        ? 'Health conditions: none.'
        : `Health conditions: ${pet.conditions.join(', ')}.`,
  )
  lines.push(
    pet.sex === 'female'
      ? 'Pronouns: she/her.'
      : pet.sex === 'male'
        ? 'Pronouns: he/him.'
        : "Pronouns: do not use he, she, him or her. Use the cat's name.",
  )

  const todayText = describeCheckin(today)
  lines.push(todayText ? `Today (${date}): ${todayText}.` : `Today (${date}): no check-in yet.`)
  if (flags.length) lines.push(`Heads-up today: ${flags.map((f) => f.code.replaceAll('_', ' ')).join(', ')}.`)
  const earlier = recent.filter((c) => c.date !== date).slice(0, 6)
  if (earlier.length) lines.push(`Recent days: ${earlier.map((c) => `${c.date}: ${describeCheckin(c) || 'no answers'}`).join('; ')}.`)
  lines.push("Write today's plan.")
  return lines.join('\n')
}

const PROBLEM_WORDS = {
  link: 'a web link',
  source: 'a claim about studies or experts',
  certainty: 'a claim of certainty',
  brand: 'a brand name',
  medicine: 'medicine words',
  diagnosis: 'an illness name',
  numbers: 'a number of grams, calories or money',
  allergen: 'a food the cat is allergic to',
  wording: 'sentences about the wrong age, time of day or he/she',
  shape: 'the wrong format',
}

export function correctionText(problems) {
  const list = [...new Set(problems)].map((p) => PROBLEM_WORDS[p] ?? p).join(', ')
  return `Your last answer had problems: ${list}. Try again: write a simple, warm summary of one or two short sentences without those, and fill in the options as before.`
}

export function buildMessages(input, problems = []) {
  const user = buildContext(input) + (problems.length ? `\n${correctionText(problems)}` : '')
  return [
    { role: 'system', content: buildSystemMessage() },
    { role: 'user', content: user },
  ]
}
