// Deterministic safety rules. No AI is involved, and the model never improvises on these.
// Every flag is { code, level, message }. level is 'attention' (amber) or 'urgent' (red).
// Feature 003 extends this file with text-based rules using the same shape.
import { addDaysIso } from '../lib/dates.js'

const NOT_A_VET = 'Pawelle is not a vet.'

// checkin: the day being looked at. previous: the stored check-in for any earlier day (or null).
// "Two days in a row" only counts when previous is exactly the previous calendar day.
export function checkinFlags(checkin, previous, petName) {
  const name = petName?.trim() || 'Your cat'
  const flags = []

  if (checkin.appetite === 'none') {
    const twoDays = previous?.appetite === 'none' && previous.date === addDaysIso(checkin.date, -1)
    flags.push(
      twoDays
        ? {
            code: 'not_eating_2d',
            level: 'urgent',
            message: `${name} hasn't eaten for two days in a row. Please call your vet today, because cats shouldn't go without food for long. ${NOT_A_VET}`,
          }
        : {
            code: 'not_eating',
            level: 'attention',
            message: `${name} isn't eating today. Keep an eye on ${name}, and call your vet if it carries on. ${NOT_A_VET}`,
          },
    )
  }

  if (checkin.litter === 'off') {
    flags.push({
      code: 'litter_off',
      level: 'attention',
      message: `Something looks different at ${name}'s litter box. Changes there are worth watching, and worth a call to your vet if they continue. ${NOT_A_VET}`,
    })
  }

  return flags
}
