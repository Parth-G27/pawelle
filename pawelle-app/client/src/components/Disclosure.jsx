import { useId, useState } from 'react'
import { ChevronIcon } from './icons.jsx'

// A collapsed row that announces its state and opens smoothly. 44 px or taller.
export default function Disclosure({ title, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div className="border-t border-line first:border-t-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="group flex min-h-12 w-full items-center justify-between gap-3 text-left font-extrabold"
        >
          <span>
            {title}
            {count != null && (
              <span className="ml-2 rounded-full bg-page px-2 py-0.5 text-sm font-bold text-muted">{count}</span>
            )}
          </span>
          <ChevronIcon
            className={`shrink-0 text-muted transition-transform duration-200 group-hover:text-ink ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </h3>
      <div
        id={id}
        role="region"
        aria-label={title}
        inert={!open}
        className={`grid transition-all duration-200 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="pb-3">{children}</div>
        </div>
      </div>
    </div>
  )
}
