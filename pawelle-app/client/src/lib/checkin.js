// Options carry a word (always shown) and a small decorative emoji (hidden from screen readers).
export const MOODS = [
  { value: 'happy', label: 'Happy', icon: '😸' },
  { value: 'calm', label: 'Calm', icon: '😌' },
  { value: 'grumpy', label: 'Grumpy', icon: '😾' },
  { value: 'hiding', label: 'Hiding', icon: '🙈' },
]
export const APPETITES = [
  { value: 'great', label: 'Great', icon: '😋' },
  { value: 'normal', label: 'Normal', icon: '🙂' },
  { value: 'low', label: 'Low', icon: '😐' },
  { value: 'none', label: 'Not eating', icon: '🚫' },
]
export const ENERGIES = [
  { value: 'high', label: 'High', icon: '⚡' },
  { value: 'normal', label: 'Normal', icon: '🐾' },
  { value: 'sleepy', label: 'Sleepy', icon: '😴' },
]
export const PLAYS = [
  { value: 0, label: 'None', icon: '💤' },
  { value: 10, label: 'About 10 min', icon: '🧶' },
  { value: 20, label: 'About 20 min', icon: '🧶' },
  { value: 30, label: '30+ min', icon: '🧶' },
]
export const LITTERS = [
  { value: 'normal', label: 'Looks normal', icon: '✅' },
  { value: 'off', label: "Something's off", icon: '👀' },
]

export const NOTE_MAX = 300

// "Just like usual": mood, appetite, energy and litter box. Play and note stay untouched.
export const USUAL = { mood: 'happy', appetite: 'normal', energy: 'normal', litter: 'normal' }

export const emptyCheckin = () => ({
  mood: null, appetite: null, energy: null, play_minutes: null, litter: null, note: '',
})

export const fromCheckin = (c) => ({
  mood: c.mood, appetite: c.appetite, energy: c.energy,
  play_minutes: c.play_minutes, litter: c.litter, note: c.note ?? '',
})

export const isAnswered = (form) =>
  ['mood', 'appetite', 'energy', 'play_minutes', 'litter'].some((k) => form[k] !== null) ||
  form.note.trim() !== ''

// Unanswered stays null; nothing is made up.
export const toPayload = (form) => ({
  mood: form.mood,
  appetite: form.appetite,
  energy: form.energy,
  play_minutes: form.play_minutes,
  litter: form.litter,
  note: form.note.trim() || null,
})

const find = (options, value) => options.find((o) => o.value === value) ?? null

// What was answered, as { key, icon, text } pills for summaries and history rows.
export function answerPills(c) {
  const rows = [
    ['mood', MOODS, c.mood, (o) => o.label],
    ['appetite', APPETITES, c.appetite, (o) => `Appetite: ${o.label}`],
    ['energy', ENERGIES, c.energy, (o) => `Energy: ${o.label}`],
    ['play', PLAYS, c.play_minutes, (o) => (o.value === 0 ? 'No play' : `Play: ${o.label}`)],
    ['litter', LITTERS, c.litter, (o) => `Litter box: ${o.label}`],
  ]
  return rows.flatMap(([key, options, value, text]) => {
    const o = value === null || value === undefined ? null : find(options, value)
    return o ? [{ key, icon: o.icon, text: text(o) }] : []
  })
}

export const moodOf = (c) => find(MOODS, c?.mood)
