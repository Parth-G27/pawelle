import { describe, expect, it } from 'vitest'
import { USUAL, answerPills, emptyCheckin, fromCheckin, isAnswered, toPayload } from './checkin.js'

describe('isAnswered', () => {
  it('is false for an empty form and true after any answer (AC2)', () => {
    expect(isAnswered(emptyCheckin())).toBe(false)
    expect(isAnswered({ ...emptyCheckin(), mood: 'happy' })).toBe(true)
    expect(isAnswered({ ...emptyCheckin(), play_minutes: 0 })).toBe(true)
    expect(isAnswered({ ...emptyCheckin(), note: 'Naps' })).toBe(true)
    expect(isAnswered({ ...emptyCheckin(), note: '   ' })).toBe(false)
  })
})

describe('USUAL preset', () => {
  it('sets four answers and leaves play and note alone (AC4)', () => {
    const form = { ...emptyCheckin(), play_minutes: 20, note: 'Zoomies' }
    const next = { ...form, ...USUAL }
    expect(next).toMatchObject({
      mood: 'happy', appetite: 'normal', energy: 'normal', litter: 'normal',
      play_minutes: 20, note: 'Zoomies',
    })
  })

  it('can still be changed afterwards', () => {
    expect({ ...emptyCheckin(), ...USUAL, mood: 'grumpy' }.mood).toBe('grumpy')
  })
})

describe('toPayload / fromCheckin', () => {
  it('keeps unanswered as null and does not invent defaults (AC5)', () => {
    expect(toPayload(emptyCheckin())).toEqual({
      mood: null, appetite: null, energy: null, play_minutes: null, litter: null, note: null,
    })
  })

  it('keeps play "None" (0) as 0, not null', () => {
    expect(toPayload({ ...emptyCheckin(), play_minutes: 0 }).play_minutes).toBe(0)
  })

  it('round-trips a saved check-in', () => {
    const saved = { mood: 'calm', appetite: null, energy: 'sleepy', play_minutes: 10, litter: 'off', note: null }
    expect(toPayload(fromCheckin(saved))).toEqual(saved)
  })
})

describe('answerPills', () => {
  it('lists only what was answered, with words', () => {
    const pills = answerPills({ mood: 'happy', appetite: null, energy: 'high', play_minutes: 0, litter: 'off' })
    expect(pills.map((p) => p.text)).toEqual(['Happy', 'Energy: High', 'No play', "Litter box: Something's off"])
    expect(answerPills({ mood: null, appetite: null, energy: null, play_minutes: null, litter: null })).toEqual([])
  })
})
