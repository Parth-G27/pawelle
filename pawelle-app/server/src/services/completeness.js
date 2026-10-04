// How well Pawelle knows the cat, as a friendly 0-100 score plus one next step.
// Each entry: points, whether it counts as answered, and the prompt shown when missing.
const FIELDS = [
  ['weight_kg', 15, (p) => p.weight_kg != null, (n) => `Add ${n}'s weight so portions fit better`],
  ['birthdate', 15, (p) => p.birthdate != null, (n) => `Add ${n}'s age so tips fit their life stage`],
  ['allergies', 10, (p) => p.allergies != null, (n) => `Tell us about ${n}'s allergies, or that there are none`],
  ['conditions', 10, (p) => p.conditions != null, (n) => `Tell us about ${n}'s health conditions, or that there are none`],
  ['photo', 5, (p) => (p.photoCount ?? 0) > 0, (n) => `Add a photo of ${n}`],
  ['sex', 5, (p) => p.sex != null, (n) => `Is ${n} a girl or a boy?`],
  ['neutered', 5, (p) => p.neutered != null, (n) => `Is ${n} neutered or spayed?`],
  ['breed', 5, (p) => !!p.breed, (n) => `What breed is ${n}?`],
  ['diet_type', 5, (p) => p.diet_type != null, (n) => `What does ${n} usually eat?`],
  ['notes', 5, (p) => !!p.notes, (n) => `Anything else about ${n} worth knowing?`],
]

const NAME_POINTS = 20

export function computeCompleteness(pet) {
  let percent = NAME_POINTS
  let next = null
  for (const [field, points, answered, prompt] of FIELDS) {
    if (answered(pet)) {
      percent += points
    } else if (!next) {
      next = { field, prompt: prompt(pet.name) }
    }
  }
  return { percent, next }
}
