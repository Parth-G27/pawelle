import { describe, expect, it } from 'vitest'
import { describeAge, lifeStage } from './lifeStage.js'

const today = new Date(Date.UTC(2026, 9, 5))

describe('lifeStage', () => {
  it('is unknown without a birthdate', () => {
    expect(lifeStage(null, today)).toBe('unknown')
  })
  it('kitten under 1 year, adult from 1 to 10, senior from 11', () => {
    expect(lifeStage('2026-01-01', today)).toBe('kitten')
    expect(lifeStage('2025-10-06', today)).toBe('kitten')   // one day short of a year
    expect(lifeStage('2025-10-05', today)).toBe('adult')    // exactly 1 year
    expect(lifeStage('2016-10-06', today)).toBe('adult')    // one day short of 10... still adult
    expect(lifeStage('2015-10-06', today)).toBe('adult')    // 10 years 11 months
    expect(lifeStage('2015-10-05', today)).toBe('senior')   // exactly 11 years
  })
})

describe('describeAge', () => {
  it('reads naturally and marks estimates', () => {
    expect(describeAge('2024-07-05', true, today)).toBe('about 2 years 3 months')
    expect(describeAge('2020-10-05', false, today)).toBe('6 years')
    expect(describeAge(null, false, today)).toBeNull()
  })
})
