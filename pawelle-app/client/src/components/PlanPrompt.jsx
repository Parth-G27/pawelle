import { CHECKIN_HINT } from '../lib/voice.js'
import Button from './Button.jsx'

// The single primary action: one tap does everything.
export default function PlanPrompt({ hasCheckin, onGenerate, busy }) {
  return (
    <section className="rounded-card bg-surface p-5 shadow-card">
      <Button variant="ai" className="w-full" onClick={() => onGenerate()} disabled={busy}>
        Get today's plan
      </Button>
      {!hasCheckin && <p className="mt-3 text-center text-muted">{CHECKIN_HINT}</p>}
    </section>
  )
}
