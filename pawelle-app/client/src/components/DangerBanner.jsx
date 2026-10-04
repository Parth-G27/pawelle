import { pausedForVet } from '../lib/voice.js'
import HeadsUp from './HeadsUp.jsx'

// Safety came first: no model was called. Calm, plain, red.
export default function DangerBanner({ name, flags }) {
  return (
    <section className="space-y-3">
      <HeadsUp flags={flags} />
      <p className="text-muted">{pausedForVet(name)}</p>
    </section>
  )
}
