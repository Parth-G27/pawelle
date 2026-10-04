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

import { planSafety, textFlags } from './safety.js'
import { loadJson } from '../lib/data.js'

describe('textFlags (dangerous words)', () => {
  it('triggers for every listed term in a sentence', () => {
    const terms = loadJson('danger-terms.json')
    for (const [category, list] of Object.entries(terms)) {
      for (const term of list) {
        const flags = textFlags(`Today she got near some ${term} in the kitchen.`)
        expect(flags.map((f) => f.category), `${category}: ${term}`).toContain(category)
      }
    }
  })

  it('matches whole words only', () => {
    expect(textFlags('She loves grapefruit-scented candles?')).toEqual([])
    expect(textFlags('Chocolatey brown fur')).toEqual([])
    expect(textFlags('She sat on the collapsible box')).toEqual([])
    expect(textFlags('Chocolate!')[0].term).toBe('chocolate')
  })

  it('handles curly apostrophes and capitals', () => {
    expect(textFlags('She CAN’T BREATHE properly')[0].category).toBe('emergency')
  })

  it('passes harmless notes', () => {
    expect(textFlags('Loves feather toys and sleeping in the sun')).toEqual([])
    expect(textFlags('')).toEqual([])
    expect(textFlags(null)).toEqual([])
  })

  it('returns one calm, fixed flag per category, naming the trigger', () => {
    const flags = textFlags('chocolate and grapes and a lily')
    expect(flags.map((f) => f.category).sort()).toEqual(['toxic_food', 'toxic_plant'])
    for (const f of flags) {
      expect(f.level).toBe('urgent')
      expect(f.message).toContain(f.term)
      expect(f.message).toContain("edit today's note")
      expect(f.message).toContain('Pawelle is not a vet.')
      expect(f.message).not.toMatch(/\p{Extended_Pictographic}/u)
    }
  })
})

describe('planSafety', () => {
  const day = (date, extra = {}) => ({ date, appetite: null, litter: null, note: null, ...extra })

  it('blocks on two consecutive days of not eating', () => {
    const r = planSafety({ today: day('2026-10-05', { appetite: 'none' }), yesterday: day('2026-10-04', { appetite: 'none' }), petName: 'Pinky' })
    expect(r.blocked).toBe(true)
    expect(r.flags[0].code).toBe('not_eating_2d')
  })

  it('blocks on a dangerous word in today\'s or yesterday\'s note', () => {
    expect(planSafety({ today: day('2026-10-05', { note: 'chewed a lily leaf' }), yesterday: null, petName: 'P' }).blocked).toBe(true)
    expect(planSafety({ today: day('2026-10-05'), yesterday: day('2026-10-04', { note: 'ate a raisin' }), petName: 'P' }).blocked).toBe(true)
  })

  it('does not block on amber flags alone, and keeps them', () => {
    const r = planSafety({ today: day('2026-10-05', { appetite: 'none', litter: 'off' }), yesterday: null, petName: 'P' })
    expect(r.blocked).toBe(false)
    expect(r.flags.map((f) => f.code)).toEqual(['not_eating', 'litter_off'])
  })

  it('shows only the red flags when blocked (red hides amber)', () => {
    const r = planSafety({ today: day('2026-10-05', { litter: 'off', note: 'seizure' }), yesterday: null, petName: 'P' })
    expect(r.blocked).toBe(true)
    expect(r.flags.every((f) => f.level === 'urgent')).toBe(true)
  })

  it('does not block with no check-in today', () => {
    expect(planSafety({ today: null, yesterday: day('2026-10-04', { appetite: 'none' }), petName: 'P' })).toEqual({ blocked: false, flags: [] })
  })
})
