import { describe, expect, it } from 'vitest'
import { basicPlan } from './basicPlan.js'
import { planSchema } from './planSchema.js'

const ctx = (extra = {}) => ({ name: 'Pinky', allergies: [], conditions: [], lifeStage: 'adult', activity_level: 'balanced', energy: null, mood: null, appetite: null, hasCheckin: false, ...extra })
const plan = (extra) => basicPlan({ name: 'Pinky', ctx: ctx(extra) })

describe('basicPlan (AC16)', () => {
  it('has the same shape as an AI plan for every life stage and activity', () => {
    for (const lifeStage of ['kitten', 'adult', 'senior', 'unknown']) {
      for (const activity_level of ['lazy', 'balanced', 'playful']) {
        const p = plan({ lifeStage, activity_level })
        expect(planSchema.safeParse(p).success, `${lifeStage}/${activity_level}`).toBe(true)
        expect(p.summary).toContain('while my brain catches up')
      }
    }
  })
  it('suits the life stage', () => {
    expect(plan({ lifeStage: 'kitten' }).meals).toHaveLength(3)
    expect(plan({ lifeStage: 'adult' }).meals).toHaveLength(2)
    const senior = plan({ lifeStage: 'senior', activity_level: 'playful' })
    expect(senior.play.every((p) => p.minutes <= 15)).toBe(true)
    expect(senior.meals.map((m) => m.reason)).toEqual(['small_meals', 'small_meals'])
  })
  it('never suggests more food and uses the usual amount', () => {
    for (const m of plan({ appetite: 'low' }).meals) expect(m.amount).toBe('usual')
  })
  it('stays gentle when the cat is sleepy', () => {
    const p = plan({ activity_level: 'playful', energy: 'sleepy' })
    expect(p.play.every((x) => x.minutes <= 10)).toBe(true)
    expect(p.play.map((x) => x.idea)).not.toContain('chase_the_toy_mouse')
  })
})
