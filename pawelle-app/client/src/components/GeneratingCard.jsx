import { useEffect, useState } from 'react'
import { SLOW_LINE, loadingLines } from '../lib/voice.js'
import { SparkleIcon } from './icons.jsx'

// Never freezes: a floating sparkle, a playful line that fades in every few seconds, and a skeleton.
export default function GeneratingCard({ name }) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const lines = loadingLines(name)
  const index = Math.floor(seconds / 4) % lines.length
  return (
    <section
      className="overflow-hidden rounded-card border-2 border-ai/15 bg-linear-to-br from-ai-soft to-surface p-5 shadow-card"
      aria-busy="true"
    >
      <div className="flex items-center gap-4" role="status" aria-live="polite">
        <span className="flex h-14 w-14 shrink-0 animate-float items-center justify-center rounded-full bg-surface text-ai shadow-card">
          <SparkleIcon width={30} height={30} className="animate-twinkle" />
        </span>
        <div className="min-w-0">
          <p key={index} className="animate-fade text-lg font-bold">
            {lines[index]}
          </p>
          {seconds >= 30 && <p className="mt-1 text-muted">{SLOW_LINE}</p>}
        </div>
      </div>
      <div className="mt-5 space-y-3" aria-hidden="true">
        <div className="h-4 w-4/5 animate-shimmer rounded-full bg-ai/10" />
        <div className="h-4 w-3/5 animate-shimmer rounded-full bg-ai/10" />
        <div className="h-14 animate-shimmer rounded-2xl bg-ai/10" />
      </div>
    </section>
  )
}
