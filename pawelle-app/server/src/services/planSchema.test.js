import { describe, expect, it } from 'vitest'
import { PLAY_IDEAS, REASONS, planJsonSchema, planSchema } from './planSchema.js'

const valid = {
  summary: "Pinky is feeling happy, so let's keep the good vibes going!",
  meals: [{ time: 'morning', amount: 'usual', reason: 'routine' }],
  play: [{ idea: 'feather_wand', minutes: 10, reason: 'short_bursts' }],
}

describe('planSchema', () => {
  it('accepts a valid plan (AC4)', () => {
    expect(planSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects ideas, amounts, times and reasons outside the lists (AC25, AC26)', () => {
    const bad = (patch) => planSchema.safeParse({ ...valid, ...patch }).success
    expect(bad({ play: [{ idea: 'skydiving', minutes: 10, reason: 'short_bursts' }] })).toBe(false)
    expect(bad({ meals: [{ time: 'morning', amount: '100g', reason: 'routine' }] })).toBe(false)
    expect(bad({ meals: [{ time: 'brunch', amount: 'usual', reason: 'routine' }] })).toBe(false)
    expect(bad({ meals: [{ time: 'morning', amount: 'usual', reason: 'made_up' }] })).toBe(false)
  })

  it('limits counts and minutes', () => {
    const m = { time: 'morning', amount: 'usual', reason: 'routine' }
    const p = { idea: 'feather_wand', minutes: 10, reason: 'short_bursts' }
    expect(planSchema.safeParse({ ...valid, meals: [] }).success).toBe(false)
    expect(planSchema.safeParse({ ...valid, meals: [m, m, m, m] }).success).toBe(false)
    expect(planSchema.safeParse({ ...valid, play: [{ ...p, minutes: 90 }] }).success).toBe(false)
    expect(planSchema.safeParse({ ...valid, summary: 'Hi' }).success).toBe(false)
  })

  it('has no free text other than the summary', () => {
    const props = planJsonSchema.properties
    expect(Object.keys(props).sort()).toEqual(['meals', 'play', 'summary'])
    expect(props.meals.items.properties.reason.enum).toEqual(REASONS.meal.map((r) => r.id))
  })

  it('builds the JSON schema enumerations from the data files', () => {
    expect(planJsonSchema.properties.play.items.properties.idea.enum).toEqual(PLAY_IDEAS.map((i) => i.id))
    expect(planJsonSchema.$schema).toBeUndefined()
  })
})
