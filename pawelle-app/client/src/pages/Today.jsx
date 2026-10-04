import { Link, Navigate, useLocation } from 'react-router-dom'
import { photoUrl } from '../api/client.js'
import Avatar from '../components/Avatar.jsx'
import CheckInCard from '../components/CheckInCard.jsx'
import ErrorNotice from '../components/ErrorNotice.jsx'
import Shell from '../components/Shell.jsx'
import { useCheckins } from '../hooks/useCheckins.js'
import { usePet } from '../hooks/usePet.js'
import { useToday } from '../hooks/useToday.js'

const greeting = (now = new Date()) => {
  const h = now.getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Today() {
  const { pet, version } = usePet()
  const today = useToday()
  const location = useLocation()
  const { status, items, error, save, reload } = useCheckins(pet?.id, 3)
  if (!pet) return <Navigate to="/welcome" replace />

  const entry = items.find((i) => i.date === today)

  return (
    <Shell>
      <div className="animate-rise space-y-5">
        <div className="flex items-center gap-4">
          <Avatar
            name={pet.name}
            size={72}
            src={pet.photos.includes(1) ? photoUrl(pet.id, 1, version) : null}
          />
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
            onSave={save}
            startEditing={Boolean(location.state?.edit)}
          />
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
