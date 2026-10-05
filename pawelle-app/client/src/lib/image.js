import { LIMITS } from './limits.js'

export class PhotoError extends Error {}

const NOT_A_PHOTO = 'Pawelle only takes photos, not videos. Try a JPG, PNG or WebP picture.'
const MAX_BYTES = 900 * 1024 // stay under the server's 1 MB limit

const toBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality))

export const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

// Only inline images: a tampered saved draft must never make the page fetch some other address.
export async function dataUrlToBlob(dataUrl) {
  if (typeof dataUrl !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/i.test(dataUrl)) {
    throw new PhotoError('That photo could not be read. Please add it again.')
  }
  return (await fetch(dataUrl)).blob()
}

// Check, shrink and re-encode a chosen file. Drawing it through a canvas also drops
// EXIF data such as GPS location. Resolves to { blob, dataUrl }.
export async function processPhoto(file) {
  const heic = /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
  if (file.type.startsWith('video/') || (!file.type.startsWith('image/') && !heic)) {
    throw new PhotoError(NOT_A_PHOTO)
  }

  let bitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new PhotoError(
      heic
        ? "This browser can't open that kind of photo (HEIC). Try a JPG or PNG picture."
        : "Pawelle couldn't read that picture. Try a JPG, PNG or WebP photo.",
    )
  }

  const scale = Math.min(1, LIMITS.photoMaxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  let blob = null
  for (const quality of [0.85, 0.7, 0.5]) {
    blob = await toBlob(canvas, 'image/webp', quality)
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality)
    if (blob && blob.size <= MAX_BYTES) break
  }
  if (!blob || blob.size > MAX_BYTES) {
    throw new PhotoError('That photo is too big to shrink. Try a different one.')
  }
  return { blob, dataUrl: await blobToDataUrl(blob) }
}
