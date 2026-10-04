import { STALE_LINE } from '../lib/voice.js'
import Button from './Button.jsx'

// Gentle and never automatic: the owner decides whether to refresh.
export default function StaleNote({ onRefresh, busy }) {
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sky-soft p-4">
      <p className="font-semibold">{STALE_LINE}</p>
      <Button variant="aiSoft" className="min-h-11" onClick={onRefresh} disabled={busy}>
        Refresh plan
      </Button>
    </div>
  )
}
