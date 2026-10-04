// Onboarding draft: kept in localStorage so a half-finished setup resumes with values intact.
const KEY = 'pawelle.onboarding.v1'

export function loadDraft() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
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
