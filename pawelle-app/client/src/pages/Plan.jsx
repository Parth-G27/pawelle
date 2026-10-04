import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getPlan, listPlans } from '../api/client.js'
import Disclosure from '../components/Disclosure.jsx'
import PlanArea from '../components/PlanArea.jsx'
import PlanView from '../components/PlanView.jsx'
import Shell from '../components/Shell.jsx'
import { useCheckins } from '../hooks/useCheckins.js'
import { usePet } from '../hooks/usePet.js'
import { usePlan } from '../hooks/usePlan.js'
import { useToday } from '../hooks/useToday.js'
import { formatDay } from '../lib/dates.js'
import { BASIC_LABEL } from '../lib/voice.js'

function PastPlan({ petId, item, today }) {
  const [plan, setPlan] = useState(undefined) // undefined = not opened yet
  async function open() {
    if (plan !== undefined) return
    try {
      setPlan((await getPlan(petId, item.date)).plan)
    } catch {
      setPlan(null)
    }
  }
  return (
    <li className="rounded-card bg-surface px-5 shadow-card" onClickCapture={open}>
      <Disclosure title={formatDay(item.date, today)}>
        <p className="mb-3 text-muted">
          {item.summary}
          {item.source === 'basic' && ` (${BASIC_LABEL})`}
        </p>
        {plan === undefined && <p className="text-muted">Opening…</p>}
        {plan === null && <p className="text-muted">This plan isn't available any more.</p>}
        {plan && <PlanView plan={plan} heading={formatDay(item.date, today)} />}
      </Disclosure>
    </li>
  )
}

export default function Plan() {
  const { pet } = usePet()
  const today = useToday()
  const planState = usePlan(pet?.id, today)
  const { items: checkins } = useCheckins(pet?.id, 3)
  const [history, setHistory] = useState([])
  const generatedAt = planState.plan?.updated_at

  useEffect(() => {
    if (pet?.id == null) return undefined
    let stale = false
    listPlans(pet.id, 30)
      .then((rows) => !stale && setHistory(rows))
      .catch(() => !stale && setHistory([]))
    return () => {
      stale = true
    }
  }, [pet?.id, generatedAt])

  if (!pet) return <Navigate to="/welcome" replace />
  const past = history.filter((h) => h.date !== today)

  return (
    <Shell>
      <div className="animate-rise space-y-5">
        <div>
          <h1 className="text-3xl font-extrabold">Plan</h1>
          <p className="text-muted">A gentle plan for {pet.name}, made on this device.</p>
        </div>
        <PlanArea
          planState={planState}
          name={pet.name}
          hasCheckin={checkins.some((c) => c.date === today)}
          view="full"
        />
        {past.length > 0 && (
          <section aria-labelledby="past-title" className="space-y-3">
            <h2 id="past-title" className="text-xl font-extrabold">
              Past plans
            </h2>
            <ul className="space-y-3">
              {past.map((item) => (
                <PastPlan key={item.date} petId={pet.id} item={item} today={today} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </Shell>
  )
}
