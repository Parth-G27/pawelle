import { describe, expect, it } from 'vitest'
import { computeCompleteness } from './completeness.js'

const base = { name: 'Pinky' }

describe('computeCompleteness', () => {
  it('scores a name-only pet at 20 and suggests weight first', () => {
    const r = computeCompleteness(base)
    expect(r.percent).toBe(20)
    expect(r.next.field).toBe('weight_kg')
    expect(r.next.prompt).toContain('Pinky')
  })

  it('counts "none" (empty list) as answered', () => {
    const noAnswer = computeCompleteness({ ...base, allergies: null })
    const none = computeCompleteness({ ...base, allergies: [] })
    expect(none.percent - noAnswer.percent).toBe(10)
  })

  it('counts "not sure" answers for sex and neutered', () => {
    expect(computeCompleteness({ ...base, sex: 'unknown', neutered: 'unknown' }).percent).toBe(30)
  })

  it('reaches 100 with everything and has no next step', () => {
    const r = computeCompleteness({
      ...base,
      weight_kg: 4,
      birthdate: '2020-01-01',
      allergies: [],
      conditions: [],
      photoCount: 1,
      sex: 'female',
      neutered: 'yes',
      breed: 'Mixed / domestic',
      diet_type: 'dry',
      notes: 'Loves boxes',
    })
    expect(r.percent).toBe(100)
    expect(r.next).toBeNull()
  })

  it('suggests the highest-value missing field next', () => {
    const r = computeCompleteness({ ...base, weight_kg: 4, birthdate: '2020-01-01' })
    expect(r.next.field).toBe('allergies')
  })
})
