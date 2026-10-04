import { describe, expect, it } from 'vitest'
import { fieldErrors } from './petSchema.js'
import { checkinInputSchema } from './checkinSchema.js'
import { addDaysIso, parseCheckinDate } from './dates.js'

const parse = (v) => checkinInputSchema.safeParse(v)

describe('checkinInputSchema', () => {
  it('accepts a single answer and leaves the rest empty (AC5)', () => {
    const r = parse({ mood: 'happy' })
    expect(r.success).toBe(true)
    expect(r.data).toEqual({
      mood: 'happy', appetite: null, energy: null, play_minutes: null, litter: null, note: null,
    })
  })

  it('requires at least one answer (AC2)', () => {
    const r = parse({})
    expect(r.success).toBe(false)
    expect(r.error.issues[0].message).toBe('Pick at least one answer first.')
    expect(parse({ mood: null, note: '   ' }).success).toBe(false)
  })

  it('counts a note alone and play "None" (0) as answered', () => {
    expect(parse({ note: 'Slept in the sun' }).success).toBe(true)
    expect(parse({ play_minutes: 0 }).data.play_minutes).toBe(0)
  })

  it('rejects unknown choices', () => {
    expect(fieldErrors(parse({ mood: 'ecstatic' }).error).mood).toBeDefined()
    expect(fieldErrors(parse({ appetite: 'huge' }).error).appetite).toBeDefined()
    expect(fieldErrors(parse({ play_minutes: 15 }).error).play_minutes).toBeDefined()
    expect(fieldErrors(parse({ litter: 'maybe' }).error).litter).toBeDefined()
  })

  it('limits the note to 300 characters and keeps markup as plain text (AC9)', () => {
    expect(fieldErrors(parse({ note: 'a'.repeat(301) }).error).note).toMatch(/300/)
    expect(parse({ note: '<b>hi</b>' }).data.note).toBe('<b>hi</b>')
  })
})

describe('parseCheckinDate', () => {
  const now = new Date(Date.UTC(2026, 9, 5, 12))
  it('accepts today, yesterday and tomorrow (any time zone)', () => {
    expect(parseCheckinDate('2026-10-05', now).ok).toBe(true)
    expect(parseCheckinDate('2026-10-04', now).ok).toBe(true)
    expect(parseCheckinDate('2026-10-06', now).ok).toBe(true)
  })
  it('rejects the far future, impossible dates, and old dates', () => {
    expect(parseCheckinDate('2026-10-07', now).ok).toBe(false)
    expect(parseCheckinDate('2026-02-30', now).ok).toBe(false)
    expect(parseCheckinDate('19-01-2026', now).ok).toBe(false)
    expect(parseCheckinDate('2019-12-31', now).ok).toBe(false)
    expect(parseCheckinDate(undefined, now).ok).toBe(false)
  })
})

describe('addDaysIso', () => {
  it('crosses month and year boundaries', () => {
    expect(addDaysIso('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDaysIso('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01')
  })
})
