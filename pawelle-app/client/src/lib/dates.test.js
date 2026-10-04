import { describe, expect, it } from 'vitest'
import { addDays, formatDay, lastNDays, localToday, weekday } from './dates.js'

describe('dates', () => {
  it('formats the local date', () => {
    expect(localToday(new Date(2026, 9, 5, 23, 59))).toBe('2026-10-05')
    expect(localToday(new Date(2026, 9, 6, 0, 1))).toBe('2026-10-06')
  })

  it('adds days across month and year ends', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-10-05', 0)).toBe('2026-10-05')
  })

  it('lists the last 7 days with today last', () => {
    const days = lastNDays(7, '2026-10-05')
    expect(days).toHaveLength(7)
    expect(days[0]).toBe('2026-09-29')
    expect(days[6]).toBe('2026-10-05')
    expect(lastNDays(7, '2026-01-03')[0]).toBe('2025-12-28')
  })

  it('names the weekday', () => {
    expect(weekday('2026-10-05')).toBe('Mon')
  })

  it('says Today and Yesterday, then a short date', () => {
    expect(formatDay('2026-10-05', '2026-10-05')).toBe('Today')
    expect(formatDay('2026-10-04', '2026-10-05')).toBe('Yesterday')
    expect(formatDay('2026-10-01', '2026-10-05')).toBe('Thu 1 Oct')
  })
})
