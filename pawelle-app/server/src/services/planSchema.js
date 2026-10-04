import { z } from 'zod'
import { loadJson } from '../lib/data.js'

export const PLAY_IDEAS = loadJson('play-ideas.json')
export const REASONS = loadJson('reasons.json')

export const TIMES = ['morning', 'midday', 'evening', 'bedtime']
export const AMOUNTS = ['usual', 'a_little_less', 'a_little_more']
export const SUMMARY_MAX = 200 // what the owner sees; the model may write a little more, and we trim at a sentence
export const SUMMARY_MODEL_MAX = 400

const ids = (list) => list.map((x) => x.id)

// The model's whole answer. Only `summary` is free text; everything else is a choice.
export const planSchema = z.object({
  summary: z.string().trim().min(10).max(SUMMARY_MODEL_MAX),
  meals: z
    .array(
      z.object({
        time: z.enum(TIMES),
        amount: z.enum(AMOUNTS),
        reason: z.enum(ids(REASONS.meal)),
      }),
    )
    .min(1)
    .max(3),
  play: z
    .array(
      z.object({
        idea: z.enum(ids(PLAY_IDEAS)),
        minutes: z.number().int().min(5).max(30),
        reason: z.enum(ids(REASONS.play)),
      }),
    )
    .min(1)
    .max(3),
})

// The same shape for Ollama's structured output, so the model cannot step outside the lists.
const { $schema, ...jsonSchema } = z.toJSONSchema(planSchema) // eslint-disable-line no-unused-vars
export const planJsonSchema = jsonSchema
