import Button from './Button.jsx'
import Disclosure from './Disclosure.jsx'
import { AiBadge, BasicTag, MealList, PlanFooter, PlayList, VetNotes, VetReminders, WatchOuts } from './PlanParts.jsx'
import SparkleBurst from './SparkleBurst.jsx'

// Today screen: the friendly line and three collapsed rows. Details are one tap away.
export default function PlanSummaryCard({ plan, onRefresh, busy, freshAt }) {
  return (
    <section className="relative rounded-card bg-surface p-5 shadow-card animate-rise" aria-labelledby="plan-title">
      {freshAt > 0 && <SparkleBurst key={freshAt} />}
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="plan-title" className="text-xl font-extrabold">
          Today's plan
        </h2>
        <AiBadge plan={plan} />
      </div>
      <p className="mt-2 text-lg">{plan.summary}</p>
      <BasicTag plan={plan} />
      <div className="mt-3">
        <Disclosure title="Meals" count={plan.meals.length}>
          <MealList meals={plan.meals} />
        </Disclosure>
        <Disclosure title="Play" count={plan.play.length}>
          <PlayList play={plan.play} />
        </Disclosure>
        {plan.watch_outs.length > 0 && (
          <Disclosure title="Watch-outs" count={plan.watch_outs.length}>
            <WatchOuts items={plan.watch_outs} />
          </Disclosure>
        )}
        <Disclosure title="When to call your vet">
          <VetReminders items={plan.vet_reminders} />
        </Disclosure>
      </div>
      <div className="mt-3">
        <VetNotes items={plan.ask_vet} />
      </div>
      <div className="mt-4 space-y-3">
        <PlanFooter plan={plan} />
        <Button variant="aiSoft" className="min-h-11" onClick={onRefresh} disabled={busy}>
          Make a fresh plan
        </Button>
      </div>
    </section>
  )
}
