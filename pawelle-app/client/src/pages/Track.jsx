import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Button, { ButtonLink } from '../components/Button.jsx'
import CheckInRow from '../components/CheckInRow.jsx'
import ErrorNotice from '../components/ErrorNotice.jsx'
import Shell from '../components/Shell.jsx'
import WeekStrip from '../components/WeekStrip.jsx'
import { useCheckins } from '../hooks/useCheckins.js'
import { usePet } from '../hooks/usePet.js'
import { useToday } from '../hooks/useToday.js'
import { addDays } from '../lib/dates.js'

const STEPS = [14, 30, 90]

export default function Track() {
  const { pet } = usePet()
  const today = useToday()
  const [range, setRange] = useState({ days: STEPS[0], before: null })
  const { status, items, error, reload } = useCheckins(pet?.id, range.days)
  if (!pet) return <Navigate to="/welcome" replace />

  // The server window is a day generous, so trim to exactly the days asked for.
  const from = addDays(today, -(range.days - 1))
  const shown = items.filter((i) => i.date >= from && i.date <= today)
  const ready = status === 'ready'
  const exhausted = range.before !== null && ready && shown.length === range.before
  const canMore = range.days < STEPS[STEPS.length - 1] && !exhausted

  return (
    <Shell>
      <div className="animate-rise space-y-5">
        <div>
          <h1 className="text-3xl font-extrabold">Track</h1>
          <p className="text-muted">How {pet.name} has been lately.</p>
        </div>

        {status === 'error' && <ErrorNotice message={error.message} onRetry={reload} />}

        <section className="rounded-card bg-surface p-4 shadow-card">
          <WeekStrip items={items} today={today} />
        </section>

        {ready && shown.length === 0 && (
          <section className="rounded-card bg-sky-soft p-6 text-center">
            <h2 className="text-lg font-extrabold">No check-ins yet</h2>
            <p className="mt-1">A quick check-in helps Pawelle know how {pet.name} is doing.</p>
            <ButtonLink to="/today" className="mt-4">
              Check in on {pet.name}
            </ButtonLink>
          </section>
        )}

        {shown.length > 0 && (
          <ul className="space-y-3">
            {shown.map((item) => (
              <CheckInRow key={item.date} item={item} today={today} />
            ))}
          </ul>
        )}

        {status === 'loading' && shown.length === 0 && (
          <div className="h-32 animate-shimmer rounded-card bg-line" role="status" aria-label="Loading check-ins" />
        )}

        {ready && shown.length > 0 && canMore && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() =>
              setRange({ days: STEPS[STEPS.indexOf(range.days) + 1], before: shown.length })
            }
          >
            Show more
          </Button>
        )}
        {exhausted && <p className="text-center text-muted">That's everything so far.</p>}
      </div>
    </Shell>
  )
}
