export const SEX_OPTIONS = [
  { value: 'female', label: 'Girl' },
  { value: 'male', label: 'Boy' },
  { value: 'unknown', label: 'Not sure' },
]
export const NEUTERED_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'Not sure' },
]
export const ACTIVITY_OPTIONS = [
  { value: 'lazy', label: 'Lazy' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'playful', label: 'Playful' },
]
export const DIET_OPTIONS = [
  { value: 'dry', label: 'Dry food' },
  { value: 'wet', label: 'Wet food' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'raw', label: 'Raw' },
  { value: 'home', label: 'Home-cooked' },
  { value: 'unknown', label: 'Not sure' },
]

export const labelFor = (options, value) => options.find((o) => o.value === value)?.label ?? null
