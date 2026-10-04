import { useEffect, useRef } from 'react'
import Button from './Button.jsx'

// Native <dialog>: focus is trapped and Esc closes it. Cancel has the initial focus.
export default function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = 'Cancel', onConfirm, onCancel, busy }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(92vw,28rem)] rounded-card bg-surface p-6 text-ink shadow-card"
    >
      <h2 id="confirm-title" className="text-xl font-extrabold">
        {title}
      </h2>
      <div className="mt-2 text-muted">{children}</div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} autoFocus>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
