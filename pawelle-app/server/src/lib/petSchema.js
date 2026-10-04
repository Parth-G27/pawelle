import { z } from 'zod'

export const SEX = ['female', 'male', 'unknown']
export const NEUTERED = ['yes', 'no', 'unknown']
export const ACTIVITY = ['lazy', 'balanced', 'playful']
export const DIET = ['dry', 'wet', 'mixed', 'raw', 'home', 'unknown']

export const LIMITS = {
  nameMax: 40,
  weightMin: 0.5,
  weightMax: 15,
  notesMax: 500,
  listItemMax: 40,
  listMax: 20,
}

const todayIso = () => new Date().toISOString().slice(0, 10)

const optionalEnum = (values, message) =>
  z.enum(values, { error: message }).nullish().transform((v) => v ?? null)

// Trim, drop empties, and de-duplicate case-insensitively (keep first spelling).
export function cleanList(items) {
  const seen = new Set()
  const out = []
  for (const raw of items) {
    const item = raw.trim().replace(/\s+/g, ' ')
    const key = item.toLowerCase()
    if (!item || seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

// null = "not answered", [] = "none", otherwise a list.
const answerList = (label) =>
  z
    .array(
      z
        .string()
        .trim()
        .max(LIMITS.listItemMax, `Each ${label} entry should be ${LIMITS.listItemMax} characters or fewer.`),
      { error: `Please pick ${label} from the list or type them in.` },
    )
    .max(LIMITS.listMax, `That's a lot of ${label}. Keep it to ${LIMITS.listMax} or fewer.`)
    .nullish()
    .transform((v) => (v == null ? null : cleanList(v)))

export const petInputSchema = z.object({
  name: z
    .string({ error: "Please tell us your cat's name." })
    .trim()
    .min(1, "Please tell us your cat's name.")
    .max(LIMITS.nameMax, `Names can be up to ${LIMITS.nameMax} characters.`),
  sex: optionalEnum(SEX, 'Please pick one of the options.'),
  neutered: optionalEnum(NEUTERED, 'Please pick one of the options.'),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date.')
    .refine((d) => !Number.isNaN(Date.parse(d)), 'Please enter a valid date.')
    .refine((d) => d <= todayIso(), 'That date is in the future. Please check it.')
    .nullish()
    .transform((v) => v ?? null),
  birthdate_estimated: z
    .boolean()
    .nullish()
    .transform((v) => (v ? 1 : 0)),
  breed: z
    .string()
    .trim()
    .max(60, 'That breed name is a bit long. Try something shorter.')
    .nullish()
    .transform((v) => (v ? v : null)),
  weight_kg: z
    .number({ error: 'Please enter the weight as a number, like 4.2.' })
    .min(LIMITS.weightMin, `Weight should be between ${LIMITS.weightMin} and ${LIMITS.weightMax} kg.`)
    .max(LIMITS.weightMax, `Weight should be between ${LIMITS.weightMin} and ${LIMITS.weightMax} kg.`)
    .nullish()
    .transform((v) => v ?? null),
  activity_level: z
    .enum(ACTIVITY, { error: 'Please pick one of the options.' })
    .nullish()
    .transform((v) => v ?? 'balanced'),
  diet_type: optionalEnum(DIET, 'Please pick one of the options.'),
  allergies: answerList('allergies'),
  conditions: answerList('conditions'),
  notes: z
    .string()
    .max(LIMITS.notesMax, `Notes can be up to ${LIMITS.notesMax} characters.`)
    .nullish()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
})

// Turn a zod error into { field: friendly message } (first message per field).
export function fieldErrors(zodError) {
  const fields = {}
  for (const issue of zodError.issues) {
    const key = issue.path[0] ?? '_'
    if (!(key in fields)) fields[key] = issue.message
  }
  return fields
}
