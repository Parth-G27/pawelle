import { AlertIcon } from './icons.jsx'

const TONES = {
  attention: { box: 'border-attention bg-attention-soft text-attention', label: 'Worth watching', role: 'status' },
  urgent: { box: 'border-urgent bg-urgent-soft text-urgent', label: 'Please contact your vet', role: 'alert' },
}

// Fixed-wording heads-ups from the server. Icon plus words, never color alone.
export default function HeadsUp({ flags }) {
  if (!flags?.length) return null
  return (
    <div className="space-y-2">
      {flags.map((f) => {
        const tone = TONES[f.level] ?? TONES.attention
        return (
          <div key={f.code} role={tone.role} className={`flex gap-3 rounded-2xl border-2 p-4 ${tone.box}`}>
            <AlertIcon className="mt-0.5 shrink-0" />
            <div>
              <p className="font-extrabold">{tone.label}</p>
              <p className="mt-0.5 font-semibold">{f.message}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
