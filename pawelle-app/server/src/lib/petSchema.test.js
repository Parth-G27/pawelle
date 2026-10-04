import { describe, expect, it } from 'vitest'
import { fieldErrors, petInputSchema } from './petSchema.js'

const parse = (input) => petInputSchema.safeParse(input)
const errs = (input) => fieldErrors(parse(input).error)

describe('petInputSchema', () => {
  it('accepts a name-only pet and applies defaults', () => {
    const r = parse({ name: '  Pinky ' })
    expect(r.success).toBe(true)
    expect(r.data).toMatchObject({
      name: 'Pinky',
      activity_level: 'balanced',
      weight_kg: null,
      allergies: null,
      conditions: null,
      birthdate_estimated: 0,
    })
  })

  it('rejects an empty or whitespace name', () => {
    expect(errs({ name: '   ' }).name).toMatch(/name/i)
    expect(errs({}).name).toMatch(/name/i)
  })

  it('rejects names over 40 characters', () => {
    expect(errs({ name: 'x'.repeat(41) }).name).toMatch(/40/)
  })

  it('accepts emoji and non-Latin names', () => {
    expect(parse({ name: 'ピンキー 🐱' }).success).toBe(true)
  })

  it('enforces the weight range', () => {
    expect(parse({ name: 'P', weight_kg: 4.2 }).success).toBe(true)
    expect(errs({ name: 'P', weight_kg: 0.2 }).weight_kg).toMatch(/0.5 and 15/)
    expect(errs({ name: 'P', weight_kg: 40 }).weight_kg).toMatch(/0.5 and 15/)
    expect(errs({ name: 'P', weight_kg: '4' }).weight_kg).toMatch(/number/)
  })

  it('rejects a birthdate in the future, accepts a past one', () => {
    expect(errs({ name: 'P', birthdate: '2999-01-01' }).birthdate).toMatch(/future/)
    expect(parse({ name: 'P', birthdate: '2021-05-01' }).success).toBe(true)
    expect(errs({ name: 'P', birthdate: 'soon' }).birthdate).toMatch(/valid date/)
  })

  it('de-duplicates allergies case-insensitively and keeps "none" as []', () => {
    const r = parse({ name: 'P', allergies: ['Chicken', 'chicken ', ' Fish', ''], conditions: [] })
    expect(r.data.allergies).toEqual(['Chicken', 'Fish'])
    expect(r.data.conditions).toEqual([])
  })

  it('rejects unknown enum values', () => {
    expect(errs({ name: 'P', sex: 'banana' }).sex).toBeDefined()
    expect(errs({ name: 'P', diet_type: 'pizza' }).diet_type).toBeDefined()
    expect(errs({ name: 'P', activity_level: 'extreme' }).activity_level).toBeDefined()
  })

  it('limits notes to 500 characters and stores plain text as-is', () => {
    expect(errs({ name: 'P', notes: 'a'.repeat(501) }).notes).toMatch(/500/)
    expect(parse({ name: 'P', notes: '<b>hi</b>' }).data.notes).toBe('<b>hi</b>')
  })
})
