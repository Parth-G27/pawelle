import { moodOf } from '../lib/checkin.js'
import { formatDay, lastNDays, weekday } from '../lib/dates.js'

// The last 7 days. A day without a check-in is quiet and neutral, never an error.
export default function WeekStrip({ items, today }) {
  const byDate = new Map(items.map((i) => [i.date, i]))
  return (
    <ol className="grid grid-cols-7 gap-1" aria-label="The last 7 days">
      {lastNDays(7, today).map((date) => {
        const entry = byDate.get(date)
        const mood = moodOf(entry)
        const word = !entry ? 'No check-in' : (mood?.label ?? 'Logged')
        return (
          <li
            key={date}
            aria-label={`${formatDay(date, today)}: ${word}`}
            className="flex flex-col items-center gap-1 text-center"
          >
            <span className={`text-xs font-bold ${date === today ? 'text-primary' : 'text-muted'}`}>
              {weekday(date)}
            </span>
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full text-xl ${
                entry ? 'bg-sage-soft' : 'border-2 border-dashed border-line'
              } ${date === today ? 'ring-2 ring-primary ring-offset-2 ring-offset-page' : ''}`}
              aria-hidden="true"
            >
              {entry ? (mood?.icon ?? '✓') : ''}
            </span>
            <span className="text-xs font-semibold text-muted" aria-hidden="true">
              {entry ? (mood?.label ?? 'Logged') : ' '}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
