import { planEmpty } from '../lib/voice.js'
import BrainAsleep from './BrainAsleep.jsx'
import DangerBanner from './DangerBanner.jsx'
import ErrorNotice from './ErrorNotice.jsx'
import GeneratingCard from './GeneratingCard.jsx'
import PlanPrompt from './PlanPrompt.jsx'
import PlanSummaryCard from './PlanSummaryCard.jsx'
import PlanView from './PlanView.jsx'
import SparkleBurst from './SparkleBurst.jsx'
import Button from './Button.jsx'
import StaleNote from './StaleNote.jsx'

// All the states of "today's plan" in one place. view: 'summary' (Today) or 'full' (Plan tab).
export default function PlanArea({ planState, name, hasCheckin, view = 'summary' }) {
  const { status, plan, safety, generating, offline, failure, error, generate, reload, freshAt } = planState

  if (status === 'loading') {
    return <div className="h-24 animate-shimmer rounded-card bg-line" role="status" aria-label="Loading today's plan" />
  }
  if (status === 'error') return <ErrorNotice message={error.message} onRetry={reload} />
  if (safety.blocked) return <DangerBanner name={name} flags={safety.flags} />
  if (generating) return <GeneratingCard name={name} />
  if (offline) {
    return (
      <BrainAsleep
        offline={offline}
        busy={generating}
        onCheckAgain={() => generate()}
        onBasic={() => generate({ basic: true })}
      />
    )
  }
  if (failure) return <ErrorNotice message={failure.message} onRetry={() => generate()} />

  if (plan) {
    const refresh = () => generate()
    return (
      <div className="space-y-3">
        {plan.stale && <StaleNote onRefresh={refresh} busy={generating} />}
        {view === 'full' ? (
          <section className="relative rounded-card bg-surface p-5 shadow-card animate-rise">
            {freshAt > 0 && <SparkleBurst key={freshAt} />}
            <PlanView plan={plan} heading="Today's plan" />
            <Button variant="aiSoft" className="mt-4 min-h-11" onClick={refresh} disabled={generating}>
              Make a fresh plan
            </Button>
          </section>
        ) : (
          <PlanSummaryCard plan={plan} onRefresh={refresh} busy={generating} freshAt={freshAt} />
        )}
      </div>
    )
  }

  if (view === 'full') {
    const empty = planEmpty(name)
    return (
      <section className="rounded-card bg-sky-soft p-6 text-center">
        <h2 className="text-lg font-extrabold">{empty.title}</h2>
        <p className="mt-1">{empty.body}</p>
        <Button variant="ai" className="mt-4" onClick={() => generate()}>
          Get today's plan
        </Button>
      </section>
    )
  }
  return <PlanPrompt hasCheckin={hasCheckin} onGenerate={generate} busy={generating} />
}
