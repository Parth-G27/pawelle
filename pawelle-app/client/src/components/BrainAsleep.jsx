import { useState } from 'react'
import { asleep } from '../lib/voice.js'
import Button from './Button.jsx'
import { CopyIcon } from './icons.jsx'

function CommandRow({ command }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
    } catch {
      const area = document.createElement('textarea')
      area.value = command
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-xl bg-line px-3 py-2.5 text-sm">{command}</code>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${command}`}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full border-2 border-line bg-surface px-3 text-sm font-bold hover:border-primary"
      >
        <CopyIcon width={18} height={18} />
        {copied ? 'Copied!' : null}
      </button>
    </div>
  )
}

// Ollama is not running, or the model is not downloaded. Exact commands, nothing to guess.
export default function BrainAsleep({ offline, onCheckAgain, onBasic, busy }) {
  const reason = offline?.fields?.reason ?? 'not_running'
  const model = offline?.fields?.model ?? 'gemma3:1b'
  const copy = asleep(reason)
  return (
    <section className="rounded-card bg-surface p-5 shadow-card" aria-labelledby="asleep-title">
      <h2 id="asleep-title" className="text-xl font-extrabold">
        {copy.title}
      </h2>
      <p className="mt-1">{copy.body}</p>
      <div className="mt-4 space-y-3">
        {reason === 'not_running' && (
          <>
            <p className="font-semibold">To wake it up, run this in a terminal:</p>
            <CommandRow command="brew services start ollama" />
            <p className="text-sm text-muted">If you installed the Ollama app instead, just open it.</p>
          </>
        )}
        {reason === 'model_missing' && (
          <>
            <p className="font-semibold">To download it, run this in a terminal:</p>
            <CommandRow command={`ollama pull ${model}`} />
          </>
        )}
      </div>
      <div className="mt-5 flex flex-col gap-3">
        <Button variant="ai" onClick={onCheckAgain} disabled={busy}>
          Check again
        </Button>
        <Button variant="text" onClick={onBasic} disabled={busy}>
          Use a simple plan for now
        </Button>
      </div>
    </section>
  )
}
