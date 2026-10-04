import { Link, Navigate, useLocation } from 'react-router-dom'
import { photoUrl } from '../api/client.js'
import Avatar from '../components/Avatar.jsx'
import CheckInCard from '../components/CheckInCard.jsx'
import PlanArea from '../components/PlanArea.jsx'
import ErrorNotice from '../components/ErrorNotice.jsx'
import Shell from '../components/Shell.jsx'
import { useCheckins } from '../hooks/useCheckins.js'
import { usePet } from '../hooks/usePet.js'
import { usePlan } from '../hooks/usePlan.js'
import { useToday } from '../hooks/useToday.js'
import { moodOf } from '../lib/checkin.js'

const greeting = (now = new Date()) => {
  const h = now.getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Today() {
  const { pet, version } = usePet()
  const today = useToday()
  const location = useLocation()
  const { status, items, error, save, reload } = useCheckins(pet?.id, 3)
  const planState = usePlan(pet?.id, today)
  if (!pet) return <Navigate to="/welcome" replace />

  const entry = items.find((i) => i.date === today)
  // After a check-in is saved, re-read the plan so its "check-in changed" note and safety stay current.
  const saveAndRefresh = async (date, payload) => {
    const saved = await save(date, payload)
    planState.reload()
    return saved
  }

  return (
    <Shell>
      <div className="animate-rise space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative transition-transform duration-200 hover:-rotate-3 hover:scale-105">
            <Avatar
              name={pet.name}
              size={72}
              src={pet.photos.includes(1) ? photoUrl(pet.id, 1, version) : null}
            />
            {moodOf(entry) && (
              <span
                key={entry.mood}
                role="img"
                aria-label={`Feeling ${moodOf(entry).label.toLowerCase()} today`}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 animate-pop items-center justify-center rounded-full bg-surface text-lg shadow-card"
              >
                {moodOf(entry).icon}
              </span>
            )}
          </div>
          <div>
            <p className="text-muted">{greeting()}!</p>
            <h1 className="text-3xl font-extrabold">{pet.name}</h1>
          </div>
        </div>

        {status === 'loading' && (
          <div className="h-48 animate-shimmer rounded-card bg-line" role="status" aria-label="Loading today's check-in" />
        )}
        {status === 'error' && <ErrorNotice message={error.message} onRetry={reload} />}
        {status === 'ready' && (
          <CheckInCard
            key={today}
            name={pet.name}
            today={today}
            entry={entry}
            onSave={saveAndRefresh}
            startEditing={Boolean(location.state?.edit)}
          />
        )}

        {status === 'ready' && (
          <PlanArea planState={planState} name={pet.name} hasCheckin={Boolean(entry)} view="summary" />
        )}

        {pet.next_suggestion && (
          <section className="rounded-card bg-surface p-5 shadow-card">
            <p className="font-bold">
              Pawelle knows {pet.name} {pet.completeness}%
            </p>
            <p className="mt-1 text-muted">{pet.next_suggestion.prompt}.</p>
            <Link to="/pet" className="mt-3 inline-flex min-h-11 items-center font-bold text-primary underline underline-offset-4">
              Add more
            </Link>
          </section>
        )}
      </div>
    </Shell>
  )
}
