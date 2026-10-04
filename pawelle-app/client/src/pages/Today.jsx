import { Link, Navigate } from 'react-router-dom'
import { photoUrl } from '../api/client.js'
import Avatar from '../components/Avatar.jsx'
import Shell from '../components/Shell.jsx'
import { usePet } from '../hooks/usePet.js'

const greeting = (now = new Date()) => {
  const h = now.getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Today() {
  const { pet, version } = usePet()
  if (!pet) return <Navigate to="/welcome" replace />

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

        <section className="rounded-card bg-sky-soft p-5">
          <h2 className="text-lg font-extrabold">Daily check-ins are coming next</h2>
          <p className="mt-1">
            Soon you’ll be able to tell Pawelle how {pet.name} is doing and get a friendly plan for food and play.
          </p>
        </section>

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
