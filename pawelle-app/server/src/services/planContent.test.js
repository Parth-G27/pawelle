import { describe, expect, it } from 'vitest'
import { buildAskVet, buildWatchOuts, foodPhrase, possessive, renderPlan, vetReminders } from './planContent.js'

describe('wording helpers', () => {
  it('makes names possessive', () => {
    expect(possessive('Pinky')).toBe("Pinky's")
    expect(possessive('Charles')).toBe("Charles'")
  })
  it('names the usual food from the diet, never a new food (AC25)', () => {
    expect(foodPhrase('Pinky', 'dry')).toBe("Pinky's usual dry food")
    expect(foodPhrase('Pinky', 'mixed')).toBe("Pinky's usual mix of dry and wet food")
    expect(foodPhrase('Pinky', 'unknown')).toBe("Pinky's usual food")
    expect(foodPhrase('Pinky', null)).toBe("Pinky's usual food")
  })
})

describe('buildAskVet (AC28)', () => {
  it('adds a note for listed conditions, heads-ups and unknown allergies, capped at 3', () => {
    const all = buildAskVet({ name: 'Pinky', conditions: ['Kidney', 'Dental'], flags: [{ code: 'not_eating' }, { code: 'litter_off' }], allergies: null })
    expect(all).toHaveLength(3)
    expect(all[0]).toContain('health conditions on file (kidney and dental)')
    expect(all[1]).toContain('not eating and the litter box')
    expect(all[2]).toContain("allergies yet")
  })
  it('stays empty when there is nothing to flag', () => {
    expect(buildAskVet({ name: 'Pinky', conditions: [], flags: [], allergies: [] })).toEqual([])
    expect(buildAskVet({ name: 'Pinky', conditions: null, flags: [], allergies: ['Fish'] })).toEqual([])
  })
  it('is calm: no emoji, no puns', () => {
    const text = buildAskVet({ name: 'Pinky', conditions: ['Kidney'], flags: [{ code: 'litter_off' }], allergies: null }).join(' ')
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u)
    expect(text).not.toMatch(/purr|paw-|meow/i)
  })
})

describe('buildWatchOuts', () => {
  it('writes calm notes from the check-in, at most 3', () => {
    const w = buildWatchOuts({
      name: 'Pinky',
      checkin: { appetite: 'low', mood: 'hiding' },
      flags: [{ code: 'not_eating' }, { code: 'litter_off' }],
    })
    expect(w).toHaveLength(3)
    expect(w.join(' ')).toContain('Pinky')
  })
  it('is empty on an ordinary day', () => {
    expect(buildWatchOuts({ name: 'Pinky', checkin: { appetite: 'normal', mood: 'happy' }, flags: [] })).toEqual([])
    expect(buildWatchOuts({ name: 'Pinky', checkin: null, flags: [] })).toEqual([])
  })
})

describe('vetReminders', () => {
  it('is fixed text that uses the cat name', () => {
    const r = vetReminders('Pinky')
    expect(r.length).toBeGreaterThanOrEqual(4)
    expect(r.join(' ')).toContain('Pinky')
    expect(r.join(' ')).not.toMatch(/\p{Extended_Pictographic}/u)
  })
})

describe('renderPlan', () => {
  const row = {
    id: 1, date: '2026-10-05', source: 'ai', model: 'gemma3:1b', reason: null, created_at: 'x', updated_at: 'y',
    content: JSON.stringify({
      summary: 'Pinky is happy today!',
      meals: [{ time: 'morning', amount: 'a_little_less', reason: 'routine' }],
      play: [{ idea: 'feather_wand', minutes: 10, reason: 'energy_match' }],
      watch_outs: ['w'], ask_vet: ['a'],
    }),
  }
  it('renders food, amounts, labels and reasons in our own words', () => {
    const p = renderPlan({ row, pet: { name: 'Pinky', diet_type: 'dry' }, stale: true })
    expect(p.meals[0]).toMatchObject({ label: 'Morning', what: "Pinky's usual dry food", portion: 'a little less than usual', why: 'A steady routine keeps tummies content.' })
    expect(p.play[0]).toMatchObject({ label: 'a feather-wand game', minutes: 10, why: "This fits Pinky's energy today." })
    expect(p.stale).toBe(true)
    expect(p.model).toBe('gemma3:1b')
    expect(p.disclaimer).toBe('Pawelle is not a vet.')
    expect(p.vet_reminders.length).toBeGreaterThan(3)
  })
})
