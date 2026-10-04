import { LIMITS } from './limits.js'
import { approxToBirthdate, birthdateToApprox, todayIso } from './age.js'

export const emptyForm = () => ({
  name: '',
  sex: null,
  neutered: null,
  ageMode: 'approx', // 'approx' | 'date'
  birthdate: '',
  ageYears: '',
  ageMonths: '',
  breed: '',
  weight: '',
  activity_level: 'balanced',
  diet_type: null,
  allergies: null, // null = not answered, [] = none
  conditions: null,
  notes: '',
})

export function fromPet(pet, today = new Date()) {
  const form = {
    ...emptyForm(),
    name: pet.name,
    sex: pet.sex,
    neutered: pet.neutered,
    breed: pet.breed ?? '',
    weight: pet.weight_kg == null ? '' : String(pet.weight_kg),
    activity_level: pet.activity_level,
    diet_type: pet.diet_type,
    allergies: pet.allergies,
    conditions: pet.conditions,
    notes: pet.notes ?? '',
  }
  if (pet.birthdate) {
    if (pet.birthdate_estimated) {
      const { years, months } = birthdateToApprox(pet.birthdate, today)
      form.ageMode = 'approx'
      form.ageYears = String(years)
      form.ageMonths = String(months)
    } else {
      form.ageMode = 'date'
      form.birthdate = pet.birthdate
    }
  }
  return form
}

const parseWeight = (text) => {
  const t = String(text).trim().replace(',', '.')
  return t === '' ? null : Number(t)
}

export function toPayload(form, today = new Date()) {
  let birthdate = null
  let estimated = false
  if (form.ageMode === 'date' && form.birthdate) {
    birthdate = form.birthdate
  } else if (form.ageMode === 'approx' && (form.ageYears !== '' || form.ageMonths !== '')) {
    birthdate = approxToBirthdate(form.ageYears, form.ageMonths, today)
    estimated = true
  }
  return {
    name: form.name.trim(),
    sex: form.sex,
    neutered: form.neutered,
    birthdate,
    birthdate_estimated: estimated,
    breed: form.breed.trim() || null,
    weight_kg: parseWeight(form.weight),
    activity_level: form.activity_level,
    diet_type: form.diet_type,
    allergies: form.allergies,
    conditions: form.conditions,
    notes: form.notes.trim() || null,
  }
}

// Friendly, field-level messages (same wording as the server). Returns {} when fine.
export function validate(form, today = new Date()) {
  const errors = {}
  if (!form.name.trim()) errors.name = "Please tell us your cat's name."
  else if (form.name.trim().length > LIMITS.nameMax) {
    errors.name = `Names can be up to ${LIMITS.nameMax} characters.`
  }

  const weight = parseWeight(form.weight)
  if (weight !== null) {
    if (Number.isNaN(weight)) errors.weight = 'Please enter the weight as a number, like 4.2.'
    else if (weight < LIMITS.weightMin || weight > LIMITS.weightMax) {
      errors.weight = `Weight should be between ${LIMITS.weightMin} and ${LIMITS.weightMax} kg.`
    }
  }

  if (form.ageMode === 'date' && form.birthdate && form.birthdate > todayIso(today)) {
    errors.birthdate = 'That date is in the future. Please check it.'
  }
  if (form.ageMode === 'approx') {
    const y = form.ageYears === '' ? 0 : Number(form.ageYears)
    const m = form.ageMonths === '' ? 0 : Number(form.ageMonths)
    if (!Number.isInteger(y) || !Number.isInteger(m) || y < 0 || m < 0 || m > 11 || y > 30) {
      errors.birthdate = 'Please use whole numbers, like 2 years and 3 months.'
    }
  }

  if (form.notes.length > LIMITS.notesMax) {
    errors.notes = `Notes can be up to ${LIMITS.notesMax} characters.`
  }
  return errors
}
