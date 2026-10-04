// Pawelle's fixed words (Constitution IX): warm, playful where it is safe, calm where it matters.
// Loading and empty states are part of the charm; health and vet wording stays plain.
export const loadingLines = (name) => [
  `${name}'s plan is being written with a tiny pencil…`,
  'Asking my cat-whisperer brain…',
  'Warming up the feather wand…',
  'Counting whiskers (twice, to be sure)…',
  `Checking in on ${name}'s mood with a gentle purr…`,
  'Fluffing the cushions of good ideas…',
  'Putting on my thinking cap (it has ear holes)…',
  'Almost there, just a little paw-lish…',
]

export const SLOW_LINE = 'This is taking a little longer than usual. Hang tight!'
export const CHECKIN_HINT = 'A quick check-in helps me tailor the plan.'
export const BASIC_LABEL = 'A simple plan while my brain catches up'
export const modelLabel = (model) => `Written on this device by ${model}`
export const STALE_LINE = 'Your check-in changed after this plan was made.'

export const planEmpty = (name) => ({
  title: 'No plan yet',
  body: `Ready when you are! I'll write a gentle plan for ${name} in a few seconds.`,
})

export const asleep = (reason) =>
  reason === 'model_missing'
    ? { title: "Pawelle's brain needs downloading", body: 'I need to download my brain once. Then I can write plans on this computer, with no internet needed.' }
    : { title: "Pawelle's brain is asleep", body: 'I write plans with a small AI that runs on this computer. It just needs waking up.' }

export const pausedForVet = (name) =>
  `I've paused today's plan so you can focus on ${name}.`
