import { BASIC_LABEL, modelLabel } from '../lib/voice.js'
import { SparkleIcon } from './icons.jsx'

export function MealList({ meals }) {
  return (
    <ul className="space-y-3">
      {meals.map((m) => (
        <li key={m.time}>
          <p className="font-bold">{m.label}</p>
          <p>
            {m.what}, {m.portion}.
          </p>
          <p className="text-muted">{m.why}</p>
        </li>
      ))}
    </ul>
  )
}

export function PlayList({ play }) {
  return (
    <ul className="space-y-3">
      {play.map((p) => (
        <li key={p.idea}>
          <p className="font-bold">
            {p.label[0].toUpperCase() + p.label.slice(1)} · about {p.minutes} min
          </p>
          <p className="text-muted">{p.why}</p>
        </li>
      ))}
    </ul>
  )
}

export function WatchOuts({ items }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}

// Notes written by the app, so a small model cannot weaken or skip them.
export function VetNotes({ items }) {
  if (!items.length) return null
  return (
    <section className="rounded-2xl bg-sky-soft p-4" aria-label="Good to check with your vet">
      <h3 className="font-extrabold">Good to check with your vet</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </section>
  )
}

export function VetReminders({ items }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}

export function PlanFooter({ plan }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
      {plan.source === 'ai' && <SparkleIcon width={14} height={14} className="shrink-0 text-ai" />}
      <span>
        {plan.source === 'basic' ? BASIC_LABEL : modelLabel(plan.model)}. {plan.disclaimer}
      </span>
    </p>
  )
}

// A small mark next to the title, so it is always clear what the AI wrote.
export function AiBadge({ plan }) {
  if (plan.source !== 'ai') return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ai-soft px-2.5 py-0.5 text-xs font-extrabold text-ai-dark">
      <SparkleIcon width={12} height={12} />
      AI plan
    </span>
  )
}

export function BasicTag({ plan }) {
  if (plan.source !== 'basic') return null
  return (
    <p className="mt-2 inline-block rounded-full bg-sky-soft px-3 py-1 text-sm font-semibold">{BASIC_LABEL}</p>
  )
}
