import { z } from 'zod'

export const MOOD = ['happy', 'calm', 'grumpy', 'hiding']
export const APPETITE = ['great', 'normal', 'low', 'none']
export const ENERGY = ['high', 'normal', 'sleepy']
export const PLAY_MINUTES = [0, 10, 20, 30]
export const LITTER = ['normal', 'off']
export const NOTE_MAX = 300

const pick = 'Please pick one of the options.'
const optionalEnum = (values) =>
  z.enum(values, { error: pick }).nullish().transform((v) => v ?? null)

export const checkinInputSchema = z
  .object({
    mood: optionalEnum(MOOD),
    appetite: optionalEnum(APPETITE),
    energy: optionalEnum(ENERGY),
    play_minutes: z
      .number({ error: pick })
      .refine((v) => PLAY_MINUTES.includes(v), pick)
      .nullish()
      .transform((v) => v ?? null),
    litter: optionalEnum(LITTER),
    note: z
      .string()
      .max(NOTE_MAX, `Notes can be up to ${NOTE_MAX} characters.`)
      .nullish()
      .transform((v) => (v && v.trim() ? v.trim() : null)),
  })
  .refine(
    (c) => Object.values(c).some((v) => v !== null),
    { message: 'Pick at least one answer first.' },
  )
