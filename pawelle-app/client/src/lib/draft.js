// Onboarding draft: kept in localStorage so a half-finished setup resumes with values intact.
const KEY = 'pawelle.onboarding.v1'

const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,/i

// A saved draft is untrusted: keep only well-formed data and inline images.
export function sanitizeDraft(draft) {
  if (!draft || typeof draft !== 'object' || typeof draft.form !== 'object' || draft.form === null) return null
  const photos = Array.isArray(draft.photos)
    ? draft.photos.filter((p) => p && typeof p.src === 'string' && IMAGE_DATA_URL.test(p.src)).slice(0, 2)
    : []
  const step = [1, 2, 3].includes(draft.step) ? draft.step : 1
  return { form: draft.form, photos, step }
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? sanitizeDraft(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function saveDraft(draft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // Storage full: keep the text answers, drop the photos.
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...draft, photos: [] }))
    } catch {
      /* nothing more we can do */
    }
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
