import { describe, expect, it } from 'vitest'
import { sanitizeDraft } from './draft.js'
import { dataUrlToBlob } from './image.js'

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

describe('a saved draft is untrusted', () => {
  it('keeps only inline images, at most two', () => {
    const d = sanitizeDraft({ form: { name: 'Pinky' }, step: 2, photos: [{ src: PNG }, { src: 'https://evil.example/x.png' }, { src: 'javascript:alert(1)' }, { src: PNG }, { src: PNG }] })
    expect(d.photos).toHaveLength(2)
    expect(d.photos.every((p) => p.src.startsWith('data:image/png;base64,'))).toBe(true)
  })
  it('rejects non-objects and bad steps', () => {
    expect(sanitizeDraft(null)).toBeNull()
    expect(sanitizeDraft('x')).toBeNull()
    expect(sanitizeDraft({ form: null })).toBeNull()
    expect(sanitizeDraft({ form: {}, step: 99 }).step).toBe(1)
    expect(sanitizeDraft({ form: {}, photos: 'nope' }).photos).toEqual([])
  })
})

describe('dataUrlToBlob', () => {
  it('reads an inline image', async () => {
    const blob = await dataUrlToBlob(PNG)
    expect(blob.size).toBeGreaterThan(10)
  })
  it('never fetches anything else', async () => {
    for (const bad of ['https://evil.example/x.png', 'http://127.0.0.1:3001/api/pets', 'javascript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', undefined, 5]) {
      await expect(dataUrlToBlob(bad)).rejects.toThrow(/could not be read/)
    }
  })
})
