import { CheckIcon } from './icons.jsx'

export function Chip({ selected, onClick, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-base font-semibold transition-all duration-150 motion-safe:active:scale-95 ${
        selected
          ? 'border-primary bg-primary-soft text-ink animate-pop'
          : 'border-line bg-surface text-ink hover:border-primary'
      }`}
      {...props}
    >
      {selected && <CheckIcon width={16} height={16} />}
      {children}
    </button>
  )
}

// Single choice. Tapping the selected chip again clears it.
export default function ChipGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o.value} selected={value === o.value} onClick={() => onChange(value === o.value ? null : o.value)}>
          {o.icon && <span aria-hidden="true">{o.icon}</span>}
          {o.label}
        </Chip>
      ))}
    </div>
  )
}
