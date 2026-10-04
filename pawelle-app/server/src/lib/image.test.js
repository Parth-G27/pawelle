import { describe, expect, it } from 'vitest'
import { sniffImage } from './image.js'

const pad = (arr) => Buffer.concat([Buffer.from(arr), Buffer.alloc(16)])

describe('sniffImage', () => {
  it('recognises JPEG, PNG and WebP', () => {
    expect(sniffImage(pad([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
    expect(sniffImage(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png')
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(8)])
    expect(sniffImage(webp)).toBe('image/webp')
  })

  it('refuses a video (mp4) and plain text', () => {
    const mp4 = Buffer.concat([Buffer.alloc(4), Buffer.from('ftypisom'), Buffer.alloc(8)])
    expect(sniffImage(mp4)).toBeNull()
    expect(sniffImage(Buffer.from('hello world, definitely not an image'))).toBeNull()
  })

  it('refuses tiny or empty buffers', () => {
    expect(sniffImage(Buffer.alloc(0))).toBeNull()
    expect(sniffImage(undefined)).toBeNull()
  })
})
