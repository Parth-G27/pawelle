import { describe, expect, it } from 'vitest'
import { BASIC_LABEL, SLOW_LINE, asleep, loadingLines, modelLabel, pausedForVet, planEmpty } from './voice.js'

const emoji = (t) => (t.match(/\p{Extended_Pictographic}/gu) ?? []).length

describe('Pawelle voice strings (AC20)', () => {
  it('uses the cat\'s name in the loading lines, with no emoji and no numbers', () => {
    const lines = loadingLines('Pinky')
    expect(lines.length).toBeGreaterThanOrEqual(6)
    expect(lines.some((l) => l.includes('Pinky'))).toBe(true)
    for (const l of lines) {
      expect(emoji(l)).toBe(0)
      expect(l).not.toMatch(/\d/)
    }
  })
  it('keeps vet and health wording plain: no emoji, no puns', () => {
    for (const t of [pausedForVet('Pinky'), asleep('x').body, SLOW_LINE]) {
      expect(emoji(t)).toBe(0)
      expect(t).not.toMatch(/purr|paw-|meow|whisker/i)
    }
    expect(pausedForVet('Pinky')).toContain('Pinky')
  })
  it('labels say which model wrote the plan, or that it is a simple plan (AC19)', () => {
    expect(modelLabel('gemma3:1b')).toBe('Written on this device by gemma3:1b')
    expect(BASIC_LABEL).toContain('simple plan')
    expect(planEmpty('Pinky').body).toContain('Pinky')
    expect(asleep('model_missing').title).toContain('downloading')
  })
})
