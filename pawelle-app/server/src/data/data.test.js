import { describe, expect, it } from 'vitest'
import { loadJson } from '../lib/data.js'

describe('data files', () => {
  it('danger terms: categories of lowercase terms', () => {
    const d = loadJson('danger-terms.json')
    expect(Object.keys(d).sort()).toEqual(['chemical', 'emergency', 'human_medicine', 'toxic_food', 'toxic_plant'])
    for (const terms of Object.values(d)) {
      expect(terms.length).toBeGreaterThan(3)
      for (const t of terms) expect(t).toBe(t.toLowerCase())
    }
  })

  it('allergen aliases map words to lists', () => {
    const a = loadJson('allergen-aliases.json')
    for (const k of ['chicken', 'fish', 'dairy', 'grains', 'eggs', 'beef']) expect(Array.isArray(a[k])).toBe(true)
  })

  it('play ideas have unique ids, labels and an energetic flag (AC26)', () => {
    const ideas = loadJson('play-ideas.json')
    expect(new Set(ideas.map((i) => i.id)).size).toBe(ideas.length)
    for (const i of ideas) {
      expect(i.label.length).toBeGreaterThan(3)
      expect(typeof i.energetic).toBe('boolean')
    }
    expect(ideas.some((i) => !i.energetic)).toBe(true)
  })

  it('reasons have unique ids, text, and no emoji', () => {
    const r = loadJson('reasons.json')
    for (const group of [r.meal, r.play]) {
      expect(new Set(group.map((x) => x.id)).size).toBe(group.length)
      for (const x of group) expect(x.text).not.toMatch(/\p{Extended_Pictographic}/u)
    }
    expect(r.meal.some((x) => !x.appliesTo)).toBe(true)
    expect(r.play.some((x) => !x.appliesTo)).toBe(true)
  })

  it('knowledge sheet and brands exist', () => {
    expect(loadJson('cat-knowledge.json').facts.length).toBeGreaterThan(4)
    expect(loadJson('brands.json')).toContain('whiskas')
  })
})
