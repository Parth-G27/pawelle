import { describe, expect, it } from 'vitest'
import { checkinFlags } from './safety.js'

const day = (date, extra = {}) => ({ date, appetite: null, litter: null, ...extra })

describe('checkinFlags', () => {
  it('raises nothing for a normal day', () => {
    expect(checkinFlags(day('2026-10-05', { appetite: 'normal', litter: 'normal' }), null, 'Pinky')).toEqual([])
    expect(checkinFlags(day('2026-10-05'), null, 'Pinky')).toEqual([])
  })

  it('raises an amber flag for one day of not eating', () => {
    const [flag, ...rest] = checkinFlags(day('2026-10-05', { appetite: 'none' }), null, 'Pinky')
    expect(rest).toEqual([])
    expect(flag).toMatchObject({ code: 'not_eating', level: 'attention' })
  })

  it('raises the red flag only for two consecutive days', () => {
    const prev = day('2026-10-04', { appetite: 'none' })
    const [flag] = checkinFlags(day('2026-10-05', { appetite: 'none' }), prev, 'Pinky')
    expect(flag).toMatchObject({ code: 'not_eating_2d', level: 'urgent' })
  })

  it('treats a gap day as a single day (amber)', () => {
    const prev = day('2026-10-03', { appetite: 'none' })
    const [flag] = checkinFlags(day('2026-10-05', { appetite: 'none' }), prev, 'Pinky')
    expect(flag).toMatchObject({ code: 'not_eating', level: 'attention' })
  })

  it('does not go red when the previous day ate', () => {
    const prev = day('2026-10-04', { appetite: 'low' })
    expect(checkinFlags(day('2026-10-05', { appetite: 'none' }), prev, 'Pinky')[0].level).toBe('attention')
  })

  it('raises an amber flag when the litter box is off', () => {
    const [flag] = checkinFlags(day('2026-10-05', { litter: 'off' }), null, 'Pinky')
    expect(flag).toMatchObject({ code: 'litter_off', level: 'attention' })
  })

  it('can raise both an appetite flag and the litter flag', () => {
    const codes = checkinFlags(day('2026-10-05', { appetite: 'none', litter: 'off' }), null, 'Pinky').map((f) => f.code)
    expect(codes).toEqual(['not_eating', 'litter_off'])
  })

  it('uses the cat name, falls back politely, and always says it is not a vet', () => {
    const all = [
      ...checkinFlags(day('2026-10-05', { appetite: 'none', litter: 'off' }), null, 'Pinky'),
      ...checkinFlags(day('2026-10-05', { appetite: 'none' }), day('2026-10-04', { appetite: 'none' }), 'Pinky'),
    ]
    for (const f of all) {
      expect(f.message).toContain('Pinky')
      expect(f.message).toContain('Pawelle is not a vet.')
    }
    expect(checkinFlags(day('2026-10-05', { litter: 'off' }), null, '')[0].message).toContain('Your cat')
  })

  it('never diagnoses or names medicine', () => {
    const all = [
      ...checkinFlags(day('2026-10-05', { appetite: 'none', litter: 'off' }), null, 'Pinky'),
      ...checkinFlags(day('2026-10-05', { appetite: 'none' }), day('2026-10-04', { appetite: 'none' }), 'Pinky'),
    ]
    const banned = /\b(mg|dose|dosage|tablet|pill|antibiotic|ibuprofen|paracetamol|medicine|medication|diagnos\w*|infection|disease|kidney|diabet\w*)\b/i
    for (const f of all) expect(f.message).not.toMatch(banned)
  })
})
