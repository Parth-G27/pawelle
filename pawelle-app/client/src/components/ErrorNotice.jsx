import { AlertIcon } from './icons.jsx'
import Button from './Button.jsx'

export default function ErrorNotice({ message, onRetry, retryLabel = 'Try again', tone = 'attention' }) {
  if (!message) return null
  const colors =
    tone === 'urgent'
      ? 'bg-urgent-soft text-urgent border-urgent'
      : 'bg-attention-soft text-attention border-attention'
  return (
    <div role="alert" className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 p-4 ${colors}`}>
      <AlertIcon className="shrink-0" />
      <p className="min-w-0 flex-1 font-semibold">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="min-h-11">
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
