import { describe, expect, it } from 'vitest'
import { approxToBirthdate, birthdateToApprox, describeAge } from './age.js'

const today = new Date(Date.UTC(2026, 9, 5)) // 2026-10-05

describe('approxToBirthdate', () => {
  it('subtracts years and months', () => {
    expect(approxToBirthdate(2, 3, today)).toBe('2024-07-05')
    expect(approxToBirthdate(0, 6, today)).toBe('2026-04-05')
    expect(approxToBirthdate(1, 0, today)).toBe('2025-10-05')
  })

  it('crosses year boundaries', () => {
    expect(approxToBirthdate(0, 10, today)).toBe('2025-12-05')
  })

  it('clamps the day to the end of a shorter month', () => {
    expect(approxToBirthdate(0, 7, new Date(Date.UTC(2026, 9, 31)))).toBe('2026-03-31')
    expect(approxToBirthdate(0, 8, new Date(Date.UTC(2026, 9, 31)))).toBe('2026-02-28')
  })

  it('treats empty values as zero', () => {
    expect(approxToBirthdate('', '', today)).toBe('2026-10-05')
  })
})

describe('birthdateToApprox', () => {
  it('round-trips with approxToBirthdate', () => {
    const iso = approxToBirthdate(3, 4, today)
    expect(birthdateToApprox(iso, today)).toEqual({ years: 3, months: 4 })
  })

  it('does not count an unfinished month', () => {
    expect(birthdateToApprox('2025-10-06', today)).toEqual({ years: 0, months: 11 })
  })

  it('never goes negative', () => {
    expect(birthdateToApprox('2026-10-05', today)).toEqual({ years: 0, months: 0 })
  })
})

describe('describeAge', () => {
  it('reads naturally', () => {
    expect(describeAge({ years: 1, months: 0 })).toBe('1 year')
    expect(describeAge({ years: 2, months: 3 })).toBe('2 years 3 months')
    expect(describeAge({ years: 0, months: 0 })).toBe('under 1 month')
  })
})
