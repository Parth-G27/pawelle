import { AiBadge, BasicTag, MealList, PlanFooter, PlayList, VetNotes, VetReminders, WatchOuts } from './PlanParts.jsx'

// The whole plan, nothing collapsed. Used on the Plan tab and when opening a past plan.
export default function PlanView({ plan, heading = 'Today' }) {
  return (
    <article className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-extrabold">{heading}</h2>
          <AiBadge plan={plan} />
        </div>
        <p className="mt-1 text-lg">{plan.summary}</p>
        <BasicTag plan={plan} />
      </header>
      <section>
        <h3 className="mb-2 font-extrabold">Meals</h3>
        <MealList meals={plan.meals} />
      </section>
      <section>
        <h3 className="mb-2 font-extrabold">Play</h3>
        <PlayList play={plan.play} />
      </section>
      {plan.watch_outs.length > 0 && (
        <section>
          <h3 className="mb-2 font-extrabold">Watch-outs</h3>
          <WatchOuts items={plan.watch_outs} />
        </section>
      )}
      <VetNotes items={plan.ask_vet} />
      <section>
        <h3 className="mb-2 font-extrabold">When to call your vet</h3>
        <VetReminders items={plan.vet_reminders} />
      </section>
      <PlanFooter plan={plan} />
    </article>
  )
}
