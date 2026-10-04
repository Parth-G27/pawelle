import { describe, expect, it } from 'vitest'
import { emptyForm, fromPet, toPayload, validate } from './petForm.js'

const today = new Date(Date.UTC(2026, 9, 5))

describe('validate', () => {
  it('requires a name', () => {
    expect(validate(emptyForm(), today).name).toBeDefined()
    expect(validate({ ...emptyForm(), name: '  ' }, today).name).toBeDefined()
    expect(validate({ ...emptyForm(), name: 'Pinky' }, today)).toEqual({})
  })

  it('checks the weight range', () => {
    const f = { ...emptyForm(), name: 'P' }
    expect(validate({ ...f, weight: '4,2' }, today).weight).toBeUndefined()
    expect(validate({ ...f, weight: '20' }, today).weight).toMatch(/0.5 and 15/)
    expect(validate({ ...f, weight: 'abc' }, today).weight).toMatch(/number/)
  })

  it('rejects a future birthdate and bad approximate ages', () => {
    const f = { ...emptyForm(), name: 'P' }
    expect(validate({ ...f, ageMode: 'date', birthdate: '2999-01-01' }, today).birthdate).toMatch(/future/)
    expect(validate({ ...f, ageMode: 'approx', ageYears: '2', ageMonths: '15' }, today).birthdate).toBeDefined()
    expect(validate({ ...f, ageMode: 'approx', ageYears: '2', ageMonths: '3' }, today).birthdate).toBeUndefined()
  })
})

describe('toPayload', () => {
  it('sends a name-only form with empty values as null', () => {
    const p = toPayload({ ...emptyForm(), name: ' Pinky ' }, today)
    expect(p).toMatchObject({
      name: 'Pinky',
      birthdate: null,
      weight_kg: null,
      breed: null,
      notes: null,
      allergies: null,
      activity_level: 'balanced',
    })
  })

  it('turns an approximate age into an estimated birthdate', () => {
    const p = toPayload({ ...emptyForm(), name: 'P', ageMode: 'approx', ageYears: '2', ageMonths: '3' }, today)
    expect(p).toMatchObject({ birthdate: '2024-07-05', birthdate_estimated: true })
  })

  it('keeps "none" as an empty list and converts the weight', () => {
    const p = toPayload({ ...emptyForm(), name: 'P', allergies: [], weight: '4,2' }, today)
    expect(p.allergies).toEqual([])
    expect(p.weight_kg).toBe(4.2)
  })
})

describe('fromPet', () => {
  it('restores an estimated age as approximate years and months', () => {
    const f = fromPet(
      { name: 'Pinky', birthdate: '2024-07-05', birthdate_estimated: true, activity_level: 'lazy', allergies: [] },
      today,
    )
    expect(f).toMatchObject({ ageMode: 'approx', ageYears: '2', ageMonths: '3', allergies: [], activity_level: 'lazy' })
  })

  it('restores an exact birthdate', () => {
    const f = fromPet({ name: 'P', birthdate: '2021-05-01', birthdate_estimated: false, activity_level: 'balanced' }, today)
    expect(f).toMatchObject({ ageMode: 'date', birthdate: '2021-05-01' })
  })
})
